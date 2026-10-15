/**
 * The mobile "Sprinkles" assistant: a floating avatar in the corner that opens a
 * chat panel. A one-to-one port of the website's `avatar-widget.tsx` onto React
 * Native - same maroon/blush avatar, mood states, voice, language toggle, quick
 * chips and safe actions (open a screen, jump to a gallery category, or pre-fill
 * the quote form).
 *
 * It appears after the splash screen and flies in from the middle of the screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, fonts, absoluteFillObject } from '../theme';
import { Destination } from '../navigation/destinations';
import { AvatarFace, type AvatarMood } from './AvatarFace';
import { speak, stopSpeaking, loadVoices } from './speech';
import { useVoiceRecorder } from './voiceRecorder';
import { writeQuoteDraft } from './quoteDraft';
import { askAssistant, isAssistantConfigured, type AssistantRequest, type VoiceClip } from './client';
import {
  ASSISTANT_NAME,
  COPY,
  PAGE_LABELS,
  PAGE_TO_DESTINATION,
  type AssistantAction,
  type AssistantPage,
  type ChatMessage,
  type ChatTurn,
  type Lang,
} from './shared';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function LevelBars({ level }: { level: number }) {
  const weights = [0.5, 0.8, 1, 0.8, 0.5];
  return (
    <View style={styles.levelBars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {weights.map((weight, index) => (
        <View
          key={index}
          style={[styles.levelBar, { height: 4 + Math.round(level * weight * 20) }]}
        />
      ))}
    </View>
  );
}

export type AssistantNavigate = (screen: Destination, options?: { galleryCategory?: string }) => void;

export function AvatarAssistant({
  page,
  navigate,
}: {
  page: AssistantPage;
  navigate: AssistantNavigate;
}) {
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [voiceOn, setVoiceOn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [welcomed, setWelcomed] = useState(false);

  const messagesRef = useRef<ChatMessage[]>([]);
  const langRef = useRef<Lang>('en');
  const voiceOnRef = useRef(true);
  const scrollRef = useRef<ScrollView>(null);

  // Intro: the avatar flies in from the middle of the screen on first paint.
  const intro = useRef(new Animated.Value(0)).current;
  const [introDone, setIntroDone] = useState(false);

  const copy = COPY[lang];

  const recorder = useVoiceRecorder({
    onClip: (clip) => void send({ clip }),
    onError: (code) => setNotice(COPY[langRef.current].voiceErrors[code]),
  });

  useEffect(() => {
    void loadVoices();
  }, []);

  // Fly the avatar in from centre, then settle in the corner.
  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIntroDone(true));
  }, [intro]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);
  useEffect(() => {
    voiceOnRef.current = voiceOn;
  }, [voiceOn]);

  function stopSpeakingAll() {
    stopSpeaking();
    setMood((current) => (current === 'speaking' ? 'idle' : current));
  }

  function speakReply(text: string) {
    if (!voiceOnRef.current) return;
    speak(text, {
      onStart: () => setMood('speaking'),
      onDone: () => setMood((current) => (current === 'speaking' ? 'idle' : current)),
    });
  }

  function runActions(actions: AssistantAction[]): string[] {
    const notes: string[] = [];
    let destination: Destination | null = null;
    let galleryCategory: string | undefined;

    for (const action of actions) {
      if (action.type === 'navigate') {
        destination = PAGE_TO_DESTINATION[action.path];
        notes.push(`Opened ${PAGE_LABELS[action.path]}`);
      } else if (action.type === 'show_gallery_category') {
        destination = Destination.Gallery;
        galleryCategory = action.category;
        notes.push(`Showing ${action.title}`);
      } else {
        writeQuoteDraft(action.quote);
        destination = Destination.Contact;
        notes.push('Filled in your quote request. Please review it');
      }
    }

    if (destination) {
      navigate(destination, galleryCategory ? { galleryCategory } : undefined);
    }
    return notes;
  }

  async function send(payload: { text: string } | { clip: VoiceClip }) {
    if (busy) return;
    const clip = 'clip' in payload ? payload.clip : null;
    const text = 'text' in payload ? payload.text.trim() : '';
    if (!clip && !text) return;
    const words = COPY[langRef.current];

    stopSpeakingAll();
    setNotice(null);
    setSuggestions([]);
    const history = messagesRef.current.filter((message) => !message.pending);
    const userMessage: ChatMessage = clip
      ? { id: uid(), role: 'user', text: words.voicePending, pending: true }
      : { id: uid(), role: 'user', text };
    const shown = [...history, userMessage];
    messagesRef.current = shown;
    setMessages(shown);
    setInput('');
    setBusy(true);
    setMood('thinking');

    const dropPending = () =>
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));

    try {
      const turns: ChatTurn[] = (clip ? history : shown).slice(-12).map(({ role, text: body }) => ({
        role,
        text: body,
      }));
      const request: AssistantRequest = {
        messages: turns,
        page,
        lang: langRef.current,
        ...(clip ? { audio: clip } : {}),
      };
      const data = await askAssistant(request);

      if (clip) {
        const heard = data.heard?.trim() || words.voiceUnclear;
        setMessages((current) =>
          current.map((message) =>
            message.id === userMessage.id ? { id: message.id, role: 'user', text: heard } : message,
          ),
        );
      }
      const notes = runActions(data.actions);
      const reply: ChatMessage = {
        id: uid(),
        role: 'assistant',
        text: data.reply,
        ...(notes.length > 0 ? { notes } : {}),
      };
      setMessages((current) => [...current, reply]);
      messagesRef.current = [...messagesRef.current, reply];
      setSuggestions(data.suggestions);
      speakReply(data.reply);
    } catch (error) {
      if (clip) dropPending();
      setNotice(error instanceof Error ? error.message : words.failed);
    } finally {
      setBusy(false);
      setMood((current) => (current === 'thinking' ? 'idle' : current));
    }
  }

  function openChat() {
    setOpen(true);
    if (!welcomed && messagesRef.current.length === 0) {
      setWelcomed(true);
      speakReply(copy.greeting);
    }
  }

  function startListening() {
    stopSpeakingAll();
    setNotice(null);
    setOpen(true);
    if (!isAssistantConfigured()) {
      setNotice(COPY[langRef.current].failed);
      return;
    }
    void recorder.start();
  }

  function toggleMic() {
    if (recorder.recording) recorder.stop();
    else startListening();
  }

  function resetChat() {
    stopSpeakingAll();
    recorder.cancel();
    setMessages([]);
    messagesRef.current = [];
    setSuggestions([]);
    setNotice(null);
    setInput('');
  }

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      40,
    );
    return () => clearTimeout(timer);
  }, [messages, busy, notice, open]);

  const chips = messages.length === 0 ? [...copy.starters] : suggestions;
  const shownMessages: ChatMessage[] =
    messages.length === 0 ? [{ id: 'greeting', role: 'assistant', text: copy.greeting }] : messages;

  // Starts at the middle of the screen and settles down into the corner.
  const translateY = intro.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0, height / 2 - 116), 0],
  });
  const scale = intro.interpolate({ inputRange: [0, 1], outputRange: [1.6, 1] });
  const panelWidth = Math.min(390, width - 24);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {open ? (
        <KeyboardAvoidingView
          style={styles.panelWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <View
            style={[styles.panel, { width: panelWidth, maxHeight: Math.min(620, height - 140) }]}
          >
            <View style={styles.header}>
              <View
                style={[
                  styles.headerAvatar,
                  mood === 'listening' ? styles.headerAvatarListening : null,
                  mood === 'speaking' ? styles.headerAvatarSpeaking : null,
                ]}
              >
                <AvatarFace mood={mood} size={64} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerName}>{ASSISTANT_NAME}</Text>
                <Text style={styles.headerStatus} numberOfLines={1}>
                  {copy.status[mood]}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <Pressable
                  onPress={() => setLang((current) => (current === 'en' ? 'ar' : 'en'))}
                  hitSlop={8}
                  style={styles.iconButton}
                  accessibilityLabel="Switch language"
                >
                  <Ionicons name="language" size={18} color={palette.primary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (voiceOn) stopSpeakingAll();
                    setVoiceOn((current) => !current);
                  }}
                  hitSlop={8}
                  style={styles.iconButton}
                  accessibilityLabel={voiceOn ? 'Mute voice' : 'Turn voice on'}
                >
                  <Ionicons
                    name={voiceOn ? 'volume-high' : 'volume-mute'}
                    size={18}
                    color={palette.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={resetChat}
                  hitSlop={8}
                  style={styles.iconButton}
                  accessibilityLabel="Start over"
                >
                  <Ionicons name="refresh" size={18} color={palette.primary} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {shownMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      message.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                      message.pending ? styles.bubblePending : null,
                    ]}
                  >
                    <Text
                      style={message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant}
                    >
                      {message.text}
                    </Text>
                    {message.notes?.map((note) => (
                      <Text key={note} style={styles.note}>
                        ✓ {note}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
              {busy ? (
                <View style={[styles.messageRow, styles.messageRowAssistant]}>
                  <View style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
              ) : null}
              {notice ? (
                <Text style={styles.noticeText} accessibilityRole="alert">
                  {notice}
                </Text>
              ) : null}
            </ScrollView>

            {chips.length > 0 && !busy && !recorder.recording ? (
              <View style={styles.chips}>
                {chips.map((chip) => (
                  <Pressable key={chip} onPress={() => void send({ text: chip })} style={styles.chip}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <Pressable
                onPress={toggleMic}
                disabled={busy}
                style={[styles.micButton, recorder.recording ? styles.micButtonActive : null]}
                accessibilityLabel={recorder.recording ? 'Stop and send' : 'Talk'}
              >
                <Ionicons
                  name={recorder.recording ? 'stop' : 'mic'}
                  size={18}
                  color={recorder.recording ? palette.primaryForeground : palette.primary}
                />
              </Pressable>

              {recorder.recording ? (
                <View style={styles.recordingBox}>
                  <LevelBars level={recorder.level} />
                  <Text style={styles.recordingLabel} numberOfLines={1}>
                    {recorder.hearingVoice ? copy.hearing : copy.speakNow}
                  </Text>
                  <Text style={styles.recordingSeconds}>{recorder.seconds}s</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.textInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder={copy.placeholder}
                  placeholderTextColor={palette.mutedForeground}
                  multiline
                  maxLength={1000}
                />
              )}

              {recorder.recording ? (
                <Pressable
                  onPress={recorder.cancel}
                  style={styles.iconButton}
                  accessibilityLabel="Cancel recording"
                >
                  <Ionicons name="close" size={18} color={palette.primary} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => void send({ text: input })}
                  disabled={busy || !input.trim()}
                  style={[styles.sendButton, busy || !input.trim() ? styles.sendButtonDisabled : null]}
                  accessibilityLabel="Send"
                >
                  <Ionicons name="send" size={16} color={palette.primaryForeground} />
                </Pressable>
              )}
            </View>
            <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      <Animated.View
        style={[styles.avatarWrap, { opacity: intro, transform: [{ translateY }, { scale }] }]}
      >
        {introDone ? null : <Text style={styles.introBalloon}>AI assistance</Text>}
        <Pressable
          onPress={() => (open ? setOpen(false) : openChat())}
          style={styles.avatarButton}
          accessibilityLabel={open ? 'Close assistant' : `Chat with ${ASSISTANT_NAME}`}
        >
          {open ? (
            <Ionicons name="close" size={30} color={palette.primary} />
          ) : (
            <AvatarFace mood={mood} size={64} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...absoluteFillObject,
  },
  panelWrap: {
    ...absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingBottom: 96,
  },
  panel: {
    backgroundColor: palette.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.blush,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  headerAvatarListening: { borderWidth: 3 },
  headerAvatarSpeaking: { borderColor: palette.secondary },
  headerText: { flex: 1, minWidth: 0 },
  headerName: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: palette.primary },
  headerStatus: { fontFamily: fonts.inter, fontSize: 12, color: palette.mutedForeground },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { flexGrow: 0, minHeight: 140 },
  messagesContent: { paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  messageRow: { flexDirection: 'row' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '86%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleUser: {
    backgroundColor: palette.primary,
    borderBottomRightRadius: 3,
  },
  bubbleAssistant: {
    backgroundColor: palette.muted,
    borderBottomLeftRadius: 3,
  },
  bubblePending: { opacity: 0.7 },
  bubbleTextUser: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: palette.primaryForeground },
  bubbleTextAssistant: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: palette.foreground },
  note: { fontFamily: fonts.interMedium, fontSize: 12, color: palette.primary, marginTop: 6 },
  thinkingBubble: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  noticeText: {
    fontFamily: fonts.inter,
    fontSize: 12,
    lineHeight: 18,
    color: palette.foreground,
    backgroundColor: palette.blush,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.background,
  },
  chipText: { fontFamily: fonts.inter, fontSize: 12, color: palette.foreground },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary,
  },
  micButtonActive: { backgroundColor: palette.primary },
  recordingBox: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.primary,
    backgroundColor: palette.blush,
    paddingHorizontal: 12,
  },
  levelBars: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  levelBar: { width: 3, borderRadius: 2, backgroundColor: palette.primary },
  recordingLabel: { flex: 1, fontFamily: fonts.interMedium, fontSize: 12, color: palette.foreground },
  recordingSeconds: { fontFamily: fonts.inter, fontSize: 12, color: palette.mutedForeground },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.inter,
    fontSize: 14,
    color: palette.foreground,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  sendButtonDisabled: { opacity: 0.4 },
  disclaimer: {
    fontFamily: fonts.inter,
    fontSize: 10,
    lineHeight: 14,
    color: palette.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarWrap: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    alignItems: 'flex-end',
  },
  introBalloon: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    color: palette.primaryForeground,
    backgroundColor: palette.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    borderWidth: 2,
    borderColor: palette.primary,
  },
});