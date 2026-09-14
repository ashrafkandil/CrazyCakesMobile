import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LocalImage, PrimaryButton, ScriptTitle, SectionHeading } from '../components/ui';
import { fonts, palette } from '../theme';
import { text } from '../db/database';
import { Destination } from '../navigation/destinations';

export function AboutScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const intro = (
    <View style={{ gap: 18 }}>
      <Text style={styles.body}>{text('about.intro')}</Text>
      <Text style={styles.bodyItalic}>{text('about.introItalic')}</Text>
    </View>
  );

  const portrait = (
    <View style={styles.portraitFrame}>
      <LocalImage src="/assets/crazy/seema.png" alt={text('about.imageAlt')} resizeMode="contain" />
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: palette.blush }}>
      <View style={[styles.page, isWide ? styles.pageWide : styles.pageNarrow]}>
        <SectionHeading title={text('about.title')} eyebrow={text('about.eyebrow')} />
        <View style={{ marginTop: 36 }}>
          <ScriptTitle title={text('about.headline')} size={34} />
        </View>
        {isWide ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 36, marginTop: 44 }}>
            <View style={{ flex: 1.1 }}>{intro}</View>
            <View style={{ flex: 0.9 }}>{portrait}</View>
          </View>
        ) : (
          <View style={{ gap: 36, marginTop: 44 }}>
            {intro}
            {portrait}
          </View>
        )}

        <View style={styles.sections}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <ScriptTitle title={text('about.experienceTitle')} size={30} />
            <Text style={styles.bodyCenter}>{text('about.experienceP1')}</Text>
            <Text style={styles.bodyCenter}>{text('about.experienceP2')}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <ScriptTitle title={text('about.communityTitle')} size={30} />
            <Text style={styles.bodyCenter}>{text('about.communityP1')}</Text>
          </View>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>{text('about.quote')}</Text>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <PrimaryButton label={text('about.cta.gallery')} outline onPress={() => navigate(Destination.Gallery)} />
          <PrimaryButton label={text('about.cta.contact')} onPress={() => navigate(Destination.Contact)} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingVertical: 64 },
  pageWide: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  pageNarrow: { maxWidth: 640, alignSelf: 'center', width: '100%' },
  body: { fontFamily: fonts.inter, fontSize: 15, lineHeight: 30, color: palette.mutedForeground },
  bodyItalic: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 30,
    color: palette.mutedForeground,
  },
  bodyCenter: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 30,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
  portraitFrame: {
    aspectRatio: 1,
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 8,
    borderColor: palette.card,
    overflow: 'hidden',
    backgroundColor: palette.card,
    alignSelf: 'center',
  },
  sections: { gap: 36, marginTop: 56 },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 26,
  },
  quoteText: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    lineHeight: 30,
    color: palette.primary,
    textAlign: 'center',
  },
  ctaRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 48 },
});
