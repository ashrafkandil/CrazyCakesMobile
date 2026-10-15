/**
 * Types and copy shared by the mobile assistant (Sprinkles). Mirrors the web
 * `src/lib/assistant/shared.ts`, adapted to the app's plain screen navigation
 * (a `Destination` instead of a URL path).
 */

import { Destination } from '../navigation/destinations';
import type { QuoteDraft } from './quoteDraft';

export const ASSISTANT_NAME = 'Sprinkles';

export type AssistantPage =
  | '/'
  | '/about'
  | '/gallery'
  | '/reviews'
  | '/pricing'
  | '/contact';

/** Web page path -> the in-app screen a `navigate` action opens. */
export const PAGE_TO_DESTINATION: Record<AssistantPage, Destination> = {
  '/': Destination.Home,
  '/about': Destination.About,
  '/gallery': Destination.Gallery,
  '/reviews': Destination.Reviews,
  '/pricing': Destination.Pricing,
  '/contact': Destination.Contact,
};

export const PAGE_LABELS: Record<AssistantPage, string> = {
  '/': 'Home',
  '/about': 'About Us',
  '/gallery': 'Gallery',
  '/reviews': 'Reviews',
  '/pricing': 'Pricing',
  '/contact': 'Quote request form',
};

export type AssistantAction =
  | { type: 'navigate'; path: AssistantPage }
  | { type: 'show_gallery_category'; category: string; title: string }
  | { type: 'prefill_quote'; quote: QuoteDraft };

export type AssistantReply = {
  /** Transcript of the visitor's voice message, when they spoke instead of typing. */
  heard?: string;
  reply: string;
  actions: AssistantAction[];
  suggestions: string[];
};

export type ChatTurn = { role: 'user' | 'assistant'; text: string };
export type ChatMessage = ChatTurn & { id: string; notes?: string[]; pending?: boolean };

export type Lang = 'en' | 'ar';

/** Arabic script block, used to pick the speaking voice. */
export const ARABIC = /[\u0600-\u06FF]/;

export const COPY = {
  en: {
    greeting: 'Hi! Welcome to Marwa Crazy Cakes. How can I help you today?',
    starters: ['Show me wedding cakes', 'How much is a custom cake?', 'I need a birthday cake'],
    placeholder: 'Type a message...',
    disclaimer: 'AI assistant. It can make mistakes; final prices are confirmed by quote.',
    status: {
      idle: 'Online · tap the mic and just talk',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
    },
    speakNow: 'Listening... speak now',
    hearing: "I hear you! I'll answer when you pause",
    voicePending: '🎤 Voice message...',
    voiceUnclear: '🎤 (voice message)',
    failed: 'Sorry, something went wrong. Please try again.',
    voiceErrors: {
      denied: 'Microphone access is blocked. Enable it for this app in your settings, then tap the mic again.',
      'no-mic': "I couldn't find a microphone. Check your sound settings.",
      unsupported: "Voice isn't available on this device. You can always type instead.",
      'no-speech': "I didn't hear anything. Check that your mic isn't muted, then tap the mic and speak.",
      failed: "I couldn't record your voice just now. Please try again or type instead.",
    },
  },
  ar: {
    greeting: 'مرحباً! أهلاً بك في Marwa Crazy Cakes. كيف يمكنني مساعدتك اليوم؟',
    starters: ['أرني كعكات الزفاف', 'كم سعر الكعكة المخصصة؟', 'أحتاج كعكة عيد ميلاد'],
    placeholder: 'اكتب رسالة...',
    disclaimer: 'مساعد ذكي وقد يخطئ؛ السعر النهائي يُؤكَّد عبر عرض السعر.',
    status: {
      idle: 'متصلة · اضغط الميكروفون وتحدّث',
      listening: 'أستمع...',
      thinking: 'أفكر...',
      speaking: 'أتحدث...',
    },
    speakNow: 'أستمع... تحدّث الآن',
    hearing: 'أسمعك! سأجيب عندما تتوقف',
    voicePending: '🎤 رسالة صوتية...',
    voiceUnclear: '🎤 (رسالة صوتية)',
    failed: 'عذراً، حدث خطأ. حاول مرة أخرى.',
    voiceErrors: {
      denied: 'تم حظر الميكروفون. فعّله من إعدادات التطبيق ثم اضغط الميكروفون مرة أخرى.',
      'no-mic': 'لم أجد ميكروفوناً. تحقق من إعدادات الصوت.',
      unsupported: 'الصوت غير متاح على هذا الجهاز. يمكنك الكتابة بدلاً من ذلك.',
      'no-speech': 'لم أسمع شيئاً. تأكد أن الميكروفون غير مكتوم ثم حاول مرة أخرى.',
      failed: 'تعذّر تسجيل صوتك الآن. حاول مرة أخرى أو اكتب رسالتك.',
    },
  },
} as const;

export type Copy = (typeof COPY)[Lang];