/**
 * Text-to-speech for the mobile assistant, mirroring the website's
 * `window.speechSynthesis` usage with expo-speech (the device's own voices).
 */

import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';

import { ARABIC } from './shared';

let voices: Voice[] = [];

/** Loads the device voices once; safe to call repeatedly. */
export async function loadVoices(): Promise<void> {
  try {
    voices = await Speech.getAvailableVoicesAsync();
  } catch {
    voices = [];
  }
}

function pickVoice(arabic: boolean): string | undefined {
  const prefix = arabic ? 'ar' : 'en';
  const matching = voices.filter((voice) => voice.language.toLowerCase().startsWith(prefix));
  const preferred = matching.find((voice) =>
    /natural|aria|jenny|samantha|zira|female|google us english/i.test(voice.name),
  );
  const chosen =
    preferred ??
    matching.find((voice) => voice.language.toLowerCase() === 'en-us') ??
    matching[0];
  return chosen?.identifier;
}

/** Strips emoji so the voice doesn't read out their names. */
function cleanForSpeech(text: string): string {
  return text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, '').trim();
}

export type SpeakHooks = { onStart?: () => void; onDone?: () => void };

/** Speaks the text, cancelling anything already being said. */
export function speak(text: string, hooks?: SpeakHooks): void {
  void Speech.stop();
  const arabic = ARABIC.test(text);
  const voice = pickVoice(arabic);
  Speech.speak(cleanForSpeech(text), {
    language: arabic ? 'ar-SA' : 'en-US',
    ...(voice ? { voice } : {}),
    rate: 1.03,
    pitch: 1.1,
    onStart: () => hooks?.onStart?.(),
    onDone: () => hooks?.onDone?.(),
    onStopped: () => hooks?.onDone?.(),
    onError: () => hooks?.onDone?.(),
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
}