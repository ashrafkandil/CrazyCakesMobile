import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalImage, ScriptTitle, platformShadow } from '../components/ui';
import { absoluteFillObject, eyebrowLetterSpacing, fonts, palette } from '../theme';
import { getTestimonials, Testimonial, text } from '../db/database';

const googleReviewsUrl = 'https://www.google.com/search?q=Marwa+Crazy+Cakes+Reviews';

export function ReviewsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 720;
  const [testimonials] = useState(() => getTestimonials());
  const bannerHeight = isWide ? 320 : 260;
  const columns = isWide ? 3 : 1;
  const cardWidth = Math.floor(((isWide ? 860 : width) - 40 - 14 * (columns - 1)) / columns);

  return (
    <ScrollView style={{ backgroundColor: 'transparent' }}>
      <View style={[styles.banner, { height: bannerHeight, marginTop: insets.top }]}>
        <LocalImage src="/assets/crazy/Testimony.png" alt={text('reviews.hero.title')} resizeMode="cover" />
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.bannerOverlay} />
        </View>
        <View style={styles.bannerContent}>
           <ScriptTitle title={text('reviews.hero.title')} size={isWide ? 44 : 36} color={palette.primary} />
           <Text style={styles.bannerEyebrow}>{text('reviews.hero.subtitle').toUpperCase()}</Text>
           <Text style={styles.bannerLine}>{text('reviews.hero.body')}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.intro}>{text('reviews.intro')}</Text>

        <View style={{ alignItems: 'center', gap: 10, marginTop: 44 }}>
          <Text style={styles.clientReviews}>{text('reviews.sectionTitle')}</Text>
          <Text style={styles.clientSub}>{text('reviews.sectionSubtitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 28, maxWidth: isWide ? 900 : undefined, alignSelf: 'center', width: '100%' }}>
          {testimonials.map((review) => (
            <View key={review.id} style={{ width: cardWidth }}>
              <TestimonialCard review={review} />
            </View>
          ))}
        </View>

        <Text onPress={() => Linking.openURL(googleReviewsUrl)} suppressHighlighting style={styles.googleButton}>
          {text('reviews.googleLinkText')}
        </Text>
      </View>
    </ScrollView>
  );
}

function TestimonialCard({ review }: { review: Testimonial }) {
  return (
    <View style={[styles.card, platformShadow]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={styles.initials}>
          <Text style={styles.initialsText}>{review.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{review.author}</Text>
          <Text style={styles.date}>{review.date}</Text>
        </View>
        <Text style={styles.stars}>{'★'.repeat(Math.max(0, review.rating))}</Text>
      </View>
      <Text style={styles.quote}>“{review.quote}”</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: palette.muted },
  bannerOverlay: { ...absoluteFillObject, backgroundColor: palette.overlay },
  bannerContent: {
    ...absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
   bannerEyebrow: {
     fontFamily: fonts.serif,
     fontSize: 11,
     letterSpacing: eyebrowLetterSpacing,
     color: palette.primary,
     textAlign: 'center',
   },
   bannerLine: {
     fontFamily: fonts.inter,
     fontSize: 16,
     color: palette.primary,
     textAlign: 'center',
   },
  content: { backgroundColor: 'transparent', paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center' },
  intro: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 30,
    color: palette.mutedForeground,
    textAlign: 'center',
    maxWidth: 720,
  },
  clientReviews: { fontFamily: fonts.serifItalic, fontSize: 26, color: palette.primary },
  clientSub: { fontFamily: fonts.inter, fontSize: 15, color: palette.mutedForeground, textAlign: 'center' },
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 20,
    gap: 16,
  },
  initials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontFamily: fonts.interSemiBold, fontSize: 15, color: palette.primaryForeground },
  author: { fontFamily: fonts.interSemiBold, fontSize: 14, color: palette.primary },
  date: { fontFamily: fonts.inter, fontSize: 11, color: palette.mutedForeground, marginTop: 2 },
  stars: { fontFamily: fonts.inter, fontSize: 13, color: palette.gold },
  quote: {
    fontFamily: fonts.inter,
    fontSize: 13,
    lineHeight: 25,
    color: palette.mutedForeground,
    fontStyle: 'italic',
  },
  googleButton: {
    marginTop: 32,
    backgroundColor: palette.primary,
    color: palette.primaryForeground,
    fontFamily: fonts.interMedium,
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
});
