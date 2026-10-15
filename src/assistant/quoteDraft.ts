/**
 * Turns the assistant's gathered details into a quote-request draft.
 *
 * The website stores this in sessionStorage; React Native has no such API, so the
 * draft lives in a module-level store instead. ContactScreen reads it on mount and
 * subscribes to changes, so a `prefill_quote` action fills the form the moment the
 * visitor lands on it - exactly like the web `crazycakes:quote-draft` event.
 */

export const QUOTE_FIELDS = [
  'name',
  'email',
  'phone',
  'eventType',
  'eventDate',
  'servings',
  'location',
  'theme',
] as const;

export type QuoteField = (typeof QUOTE_FIELDS)[number];
export type QuoteDraft = Partial<Record<QuoteField, string>>;

type Listener = () => void;

let draft: QuoteDraft = {};
const listeners = new Set<Listener>();

export function readQuoteDraft(): QuoteDraft {
  return draft;
}

/** Merge new details into the saved quote draft and notify an open contact form. */
export function writeQuoteDraft(patch: QuoteDraft): void {
  const next: QuoteDraft = { ...draft };
  for (const field of QUOTE_FIELDS) {
    const value = patch[field];
    if (typeof value === 'string' && value.trim()) next[field] = value;
  }
  draft = next;
  listeners.forEach((listener) => listener());
}

export function clearQuoteDraft(): void {
  draft = {};
  listeners.forEach((listener) => listener());
}

/** Subscribe to draft changes. Returns an unsubscribe function. */
export function subscribeQuoteDraft(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}