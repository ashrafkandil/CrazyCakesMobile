/**
 * Records the visitor's voice with expo-audio and hands back a small base64 clip
 * for Gemini. Mirrors the web `use-voice-recorder.ts` (browsers used a WebAudio
 * WAV encoder; here the OS records an m4a), following the same
 * record -> auto/manual stop -> send flow.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioQuality,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio';
import { File } from 'expo-file-system';

import type { VoiceClip } from './client';

export type VoiceError = 'denied' | 'no-mic' | 'unsupported' | 'no-speech' | 'failed';

const MAX_MS = 20_000;
const MIN_SPEECH_MS = 400;
const TICK_MS = 120;

/** A compact, mono voice recording - small enough to inline in a JSON request. */
const VOICE_RECORDING: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 32_000,
  isMeteringEnabled: true,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac', audioSource: 'voice_recognition' },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 32_000 },
};

type Callbacks = { onClip: (clip: VoiceClip) => void; onError: (error: VoiceError) => void };

function mimeFor(uri: string): string {
  const extension = uri.split('?')[0]!.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'webm') return 'audio/webm';
  if (extension === '3gp') return 'audio/3gpp';
  if (extension === 'caf') return 'audio/aiff';
  if (extension === 'mp3') return 'audio/mp3';
  // Android (mpeg4/aac) writes .m4a and iOS (MPEG4AAC) writes .m4a too.
  return 'audio/m4a';
}

export function useVoiceRecorder(callbacks: Callbacks) {
  const recorder = useAudioRecorder(VOICE_RECORDING);
  const state = useAudioRecorderState(recorder, TICK_MS);
  const [level, setLevel] = useState(0);
  const [hearingVoice, setHearingVoice] = useState(false);
  const [busy, setBusy] = useState(false);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const startedAtRef = useRef(0);
  const heardVoiceRef = useRef(false);
  const finishingRef = useRef(false);

  // Drive the level meter: use the OS meter when it reports a value, otherwise a
  // gentle animation so the visitor can still see that recording is live.
  useEffect(() => {
    if (!state.isRecording) {
      setLevel(0);
      return;
    }
    const metering = typeof state.metering === 'number' ? state.metering : null;
    if (metering !== null) {
      const normalized = Math.max(0, Math.min(1, (metering + 60) / 40));
      setLevel(normalized);
      if (normalized > 0.2) {
        heardVoiceRef.current = true;
        setHearingVoice(true);
      }
    } else {
      setLevel(0.35 + 0.35 * Math.abs(Math.sin(Date.now() / 300)));
    }
  }, [state.isRecording, state.metering, state.durationMillis]);

  // Auto-stop when the clip gets too long.
  useEffect(() => {
    if (!state.isRecording) return;
    if (state.durationMillis > MAX_MS) void finish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRecording, state.durationMillis]);

  const finish = useCallback(
    async (send: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      try {
        await recorder.stop();
        const uri = recorder.uri;
        const elapsed = Date.now() - startedAtRef.current;
        if (!send || !uri || (elapsed < MIN_SPEECH_MS && !heardVoiceRef.current)) {
          if (send) callbacksRef.current.onError('no-speech');
          return;
        }
        const base64 = await new File(uri).base64();
        callbacksRef.current.onClip({ mimeType: mimeFor(uri), data: base64 });
      } catch {
        if (send) callbacksRef.current.onError('failed');
      } finally {
        finishingRef.current = false;
        heardVoiceRef.current = false;
        setHearingVoice(false);
        setLevel(0);
      }
    },
    [recorder],
  );

  const start = useCallback(async () => {
    if (recorder.isRecording) return;
    setBusy(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        callbacksRef.current.onError(permission.canAskAgain ? 'denied' : 'no-mic');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });
      await recorder.prepareToRecordAsync();
      heardVoiceRef.current = false;
      startedAtRef.current = Date.now();
      setHearingVoice(false);
      recorder.record();
    } catch {
      callbacksRef.current.onError('failed');
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder]);

  const stop = useCallback(() => void finish(true), [finish]);
  const cancel = useCallback(() => void finish(false), [finish]);

  useEffect(() => () => void finish(false), [finish]);

  return {
    recording: state.isRecording,
    level,
    seconds: Math.floor(state.durationMillis / 1000),
    hearingVoice,
    busy,
    start,
    stop,
    cancel,
  };
}