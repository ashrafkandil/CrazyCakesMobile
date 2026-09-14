import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import { LocalImage, SocialPill, socialLinks } from '../components/ui';
import { eyebrowLetterSpacing, fonts, palette } from '../theme';
import { getEventTypes } from '../db/database';

export function ContactScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const eventTypes = getEventTypes();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [servings, setServings] = useState('');
  const [location, setLocation] = useState('');
  const [theme, setTheme] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    name.trim().length > 0 &&
    email.includes('@') &&
    phone.trim().length > 0 &&
    eventType.length > 0 &&
    eventDate.trim().length > 0 &&
    servings.trim().length > 0 &&
    theme.trim().length > 0;

  const form = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Request a Custom Quote</Text>
      {submitted ? (
        <View style={styles.thanks}>
          <Text style={styles.thanksTitle}>Thank you!</Text>
          <Text style={styles.thanksBody}>
            Your inquiry is ready. We'll be in touch within 24 hours.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14, marginTop: 22 }}>
          <Field label="Name *" value={name} onChangeText={setName} />
          <Field label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.fieldLabel}>Event Type *</Text>
          <Pressable style={styles.selectBox} onPress={() => setMenuOpen(true)}>
            <Text style={[styles.selectValue, !eventType ? styles.selectPlaceholder : null]}>
              {eventType || 'Select event type'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={palette.mutedForeground} />
          </Pressable>

          <Field label="Event Date * (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} placeholder="2026-10-15" />
          <Field label="Number of Servings *" value={servings} onChangeText={setServings} keyboardType="numeric" />
          <Field label="Event/Delivery Location" value={location} onChangeText={setLocation} />
          <Text style={styles.fieldLabel}>Tell us more about your theme! *</Text>
          <TextInput
            style={styles.textArea}
            value={theme}
            onChangeText={setTheme}
            multiline
            textAlignVertical="top"
            placeholder="Describe the dream cake…"
            placeholderTextColor="rgba(118,104,103,0.7)"
          />
          <Pressable
            onPress={() => setSubmitted(true)}
            disabled={!isValid}
            style={({ pressed }) => [
              styles.submit,
              !isValid ? styles.submitDisabled : null,
              pressed && isValid ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={styles.submitText}>Send Inquiry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const aside = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Get in Touch</Text>
      <View style={{ gap: 16, marginTop: 20 }}>
        <Pressable onPress={() => Linking.openURL('mailto:fcabakery@gmail.com')}>
          <InfoRow icon="mail" text="fcabakery@gmail.com" />
        </Pressable>
        <Pressable onPress={() => Linking.openURL('tel:12165718440')}>
          <InfoRow icon="call" text="216.571.8440" />
        </Pressable>
        <InfoRow
          icon="location-outline"
          text="Chagrin Falls, OH 44022\nServing Bainbridge, Solon, Pepper Pike, Twinsburg, Mayfield and nearby areas"
        />
      </View>
      <View style={{ marginTop: 28, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="share-social" size={16} color={palette.primary} />
          <Text style={styles.asideSub}>Follow Us</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {socialLinks.map((social) => (
            <SocialPill key={social.label} label={social.label} url={social.url} />
          ))}
        </View>
      </View>
      <View style={styles.note}>
        <Ionicons name="calendar-outline" size={18} color={palette.primary} />
        <Text style={styles.noteText}>
          We'll respond to your inquiry within 24 hours. For urgent requests, please call us
          directly.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ backgroundColor: palette.blush }} contentContainerStyle={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center' }}>
        <Text style={styles.title}>Let’s Create Something Beautiful</Text>
        <Text style={styles.eyebrow}>READY TO BRING YOUR VISION TO LIFE</Text>
        <Text style={styles.subtitle}>
          Get in touch to discuss your custom cake needs. We're excited to be part of your special
          celebration.
        </Text>

        <View
          style={[
            styles.columns,
            isWide ? { flexDirection: 'row', alignItems: 'flex-start', gap: 40 } : { gap: 32, width: '100%', maxWidth: 640 },
          ]}
        >
          <View style={{ flex: isWide ? 1.3 : 1, maxWidth: 640 }}>{form}</View>
          <View style={{ flex: isWide ? 0.7 : 1, width: isWide ? undefined : '100%' }}>{aside}</View>
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Event Type</Text>
            {eventTypes.map((type) => (
              <Pressable
                key={type}
                style={styles.modalItem}
                onPress={() => {
                  setEventType(type);
                  setMenuOpen(false);
                }}
              >
                <Text style={styles.modalItemText}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = 'words',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  placeholder?: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor="rgba(118,104,103,0.7)"
      />
    </View>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Ionicons name={icon} size={18} color={palette.primary} style={{ marginTop: 2 }} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.script, fontSize: 38, color: palette.primary, textAlign: 'center' },
  eyebrow: {
    fontFamily: fonts.serif,
    fontSize: 11,
    letterSpacing: eyebrowLetterSpacing,
    color: palette.mutedForeground,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 26,
    color: palette.mutedForeground,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 560,
  },
  columns: { marginTop: 44, width: '100%', maxWidth: 980 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 24,
  },
  cardTitle: { fontFamily: fonts.serifSemiBold, fontSize: 22, color: palette.primary },
  fieldLabel: { fontFamily: fonts.interMedium, fontSize: 13, color: palette.foreground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.inter,
    fontSize: 15,
    color: palette.foreground,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontFamily: fonts.inter, fontSize: 15, color: palette.foreground },
  selectPlaceholder: { color: palette.mutedForeground },
  textArea: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.inter,
    fontSize: 15,
    color: palette.foreground,
    height: 110,
    textAlignVertical: 'top',
  },
  submit: { backgroundColor: palette.primary, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontFamily: fonts.interMedium, fontSize: 15, color: palette.primaryForeground },
  thanks: {
    backgroundColor: palette.blush,
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  thanksTitle: { fontFamily: fonts.script, fontSize: 30, color: palette.primary },
  thanksBody: { fontFamily: fonts.inter, fontSize: 14, color: palette.mutedForeground, textAlign: 'center' },
  asideSub: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: palette.foreground },
  infoText: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, color: palette.mutedForeground, flex: 1 },
  note: {
    marginTop: 28,
    backgroundColor: palette.blush,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, color: palette.mutedForeground, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: palette.primary, marginBottom: 8 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.border },
  modalItemText: { fontFamily: fonts.inter, fontSize: 16, color: palette.foreground },
});
