/**
 * Calls Google Gemini directly from the device (the same free-tier API the website
 * uses) and turns the model's flat JSON into validated `AssistantReply`.
 *
 * The web keeps the API key on the server in `src/app/api/assistant/route.ts`. An
 * app has no server, so the key ships in the bundle as `EXPO_PUBLIC_GEMINI_API_KEY`
 * and is read here. See README.md for the security note.
 */

import { getGallery, getEventTypes } from '../db/database';
import { buildSystemPrompt } from './knowledge';
import {
  PAGE_LABELS,
  type AssistantAction,
  type AssistantPage,
  type AssistantReply,
  type ChatTurn,
  type Lang,
} from './shared';
import type { QuoteDraft, QuoteField } from './quoteDraft';

/**
 * Tried in order. Google retires model versions over time, so we fall back
 * automatically. Lite first: they answer in under a second on the free tier.
 */
const DEFAULT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

const NONE = 'none';
const MAX_TURNS = 12;
const VOICE_PROMPT =
  'This is a voice message from the visitor. Write exactly what they said in "heard" (in the language they spoke), then reply to it. If it is silent or unclear, set "heard" to "" and kindly ask them to repeat.';

/** Flat output fields from the model -> quote form fields. */
const QUOTE_OUTPUT_FIELDS = {
  quote_name: 'name',
  quote_email: 'email',
  quote_phone: 'phone',
  quote_event_type: 'eventType',
  quote_event_date: 'eventDate',
  quote_servings: 'servings',
  quote_location: 'location',
  quote_theme: 'theme',
} as const satisfies Record<string, QuoteField>;

const QUOTE_OUTPUT_KEYS = Object.keys(
  QUOTE_OUTPUT_FIELDS,
) as (keyof typeof QUOTE_OUTPUT_FIELDS)[];

export type VoiceClip = { mimeType: string; data: string };

export type AssistantRequest = {
  messages: ChatTurn[];
  audio?: VoiceClip;
  page: AssistantPage;
  lang: Lang;
};

export class AssistantError extends Error {}

function apiKey(): string {
  // Statically referenced so Expo's env inliner replaces it at build time.
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? '';
}

function modelChain(): string[] {
  const configured = [process.env.EXPO_PUBLIC_GEMINI_MODEL, ...DEFAULT_MODELS]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model));
  return [...new Set(configured)];
}

function apiBase(): string {
  const configured = process.env.EXPO_PUBLIC_GEMINI_API_BASE_URL?.trim();
  return (configured || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '');
}

export function isAssistantConfigured(): boolean {
  return apiKey().length > 0;
}

/** A flat schema: nested objects made small models loop, so every field is top-level. */
function responseSchema(categorySlugs: string[], eventTypes: string[]) {
  const text = { type: 'STRING' };
  const properties: Record<string, unknown> = {
    heard: { type: 'STRING', description: 'Transcript of a voice message, otherwise empty' },
    reply: { type: 'STRING', description: 'Spoken reply, 1-3 short sentences' },
    navigate_to: { type: 'STRING', enum: [NONE, ...Object.keys(PAGE_LABELS)] },
    gallery_category: { type: 'STRING', enum: [NONE, ...categorySlugs] },
    update_quote: { type: 'BOOLEAN' },
    quote_name: text,
    quote_email: text,
    quote_phone: text,
    quote_event_type: { type: 'STRING', enum: [NONE, ...eventTypes] },
    quote_event_date: { type: 'STRING', description: 'YYYY-MM-DD or empty' },
    quote_servings: { type: 'STRING', description: 'Digits only or empty' },
    quote_location: text,
    quote_theme: { type: 'STRING', description: 'Design idea only, max 2 sentences, or empty' },
    suggestions: { type: 'ARRAY', items: text },
  };
  const order = Object.keys(properties);
  return { type: 'OBJECT', properties, required: order, propertyOrdering: order };
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
};

function stringField(output: Record<string, unknown>, key: string): string {
  const value = output[key];
  return typeof value === 'string' ? value.trim() : '';
}

function cleanQuote(output: Record<string, unknown>, eventTypes: string[]): QuoteDraft {
  const draft: QuoteDraft = {};
  for (const key of QUOTE_OUTPUT_KEYS) {
    const field = QUOTE_OUTPUT_FIELDS[key];
    const text = stringField(output, key).slice(0, 300);
    if (!text) continue;
    if (field === 'eventType' && !eventTypes.includes(text)) continue;
    if (field === 'eventDate' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) continue;
    if (field === 'servings' && !/^\d{1,4}$/.test(text)) continue;
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) continue;
    draft[field] = text;
  }
  return draft;
}

/** Returns null when the model output is unusable (truncated, wrong shape). */
function normalize(raw: string, withAudio: boolean): AssistantReply | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(
      raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/, ''),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const reply = stringField(parsed, 'reply');
  if (!reply) return null;

  const eventTypes = getEventTypes();
  const categories = new Map(getGallery().categories.map((item) => [item.slug, item.title]));
  const actions: AssistantAction[] = [];
  const quote = parsed.update_quote === true ? cleanQuote(parsed, eventTypes) : {};
  const galleryCategory = stringField(parsed, 'gallery_category');
  const categoryTitle = galleryCategory ? categories.get(galleryCategory) : undefined;
  const navigateTo = stringField(parsed, 'navigate_to');
  const page = (Object.keys(PAGE_LABELS) as AssistantPage[]).find((path) => path === navigateTo);

  if (Object.keys(quote).length > 0) {
    actions.push({ type: 'prefill_quote', quote });
  } else if (categoryTitle && galleryCategory) {
    actions.push({ type: 'show_gallery_category', category: galleryCategory, title: categoryTitle });
  } else if (page) {
    actions.push({ type: 'navigate', path: page });
  }

  const heard = withAudio ? stringField(parsed, 'heard').slice(0, 500) : '';
  const suggestions = Array.isArray(parsed.suggestions)
    ? (parsed.suggestions as unknown[])
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    reply: reply.slice(0, 600),
    actions,
    suggestions,
    ...(heard ? { heard } : {}),
  };
}

async function generate(model: string, body: unknown, signal: AbortSignal): Promise<string> {
  const response = await fetch(`${apiBase()}/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey() },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (!response.ok) {
    throw new AssistantError(data.error?.message ?? `HTTP ${response.status}`);
  }
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();
  if (!text) throw new AssistantError('Empty response');
  return text;
}

/** Sends the conversation (text or a short voice clip) to Gemini and returns the reply. */
export async function askAssistant(request: AssistantRequest): Promise<AssistantReply> {
  if (!isAssistantConfigured()) {
    throw new AssistantError(
      "The assistant isn't set up yet. Add EXPO_PUBLIC_GEMINI_API_KEY to a .env file and restart the app.",
    );
  }

  const categories = getGallery().categories;
  const eventTypes = getEventTypes();
  const turns = request.messages.filter((turn) => turn.text.trim()).slice(-MAX_TURNS);

  const contents: { role: 'user' | 'model'; parts: Record<string, unknown>[] }[] = turns.map(
    (turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    }),
  );
  if (request.audio) {
    contents.push({
      role: 'user',
      parts: [
        { inlineData: { mimeType: request.audio.mimeType, data: request.audio.data } },
        { text: VOICE_PROMPT },
      ],
    });
  }

  const body = {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt({ page: request.page, lang: request.lang }) }],
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
      responseSchema: responseSchema(
        categories.map((category) => category.slug),
        eventTypes,
      ),
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  let lastError: unknown;
  try {
    for (const model of modelChain()) {
      try {
        const text = await generate(model, body, controller.signal);
        const reply = normalize(text, Boolean(request.audio));
        if (reply) return reply;
        lastError = new AssistantError('Unusable response');
      } catch (error) {
        if (controller.signal.aborted) throw error;
        lastError = error;
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  if (lastError instanceof AssistantError) {
    throw new AssistantError(
      /free-tier|quota|429|RESOURCE_EXHAUSTED/i.test(lastError.message)
        ? "I'm a little busy right now. Please try again in a minute."
        : "Sorry, I couldn't get an answer just now. Please try again.",
    );
  }
  throw new AssistantError("Sorry, I couldn't get an answer just now. Please try again.");
}