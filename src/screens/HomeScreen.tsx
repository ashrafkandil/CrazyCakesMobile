import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandFooter,
  LocalImage,
  PrimaryButton,
  ScriptTitle,
  SectionHeading,
  Eyebrow,
  platformShadow,
} from '../components/ui';
import { absoluteFillObject, fonts, palette } from '../theme';
import { text } from '../db/database';
import { Destination } from '../navigation/destinations';

type HeroSlide = { src: string; alt: string };
type CardEntry = { screen: Destination; image: string; keyId: string };

const heroSlides: HeroSlide[] = [
  { src: '/assets/crazy/hero-1.jpg', alt: 'Jaw-dropping sculpted cake masterpiece' },
  { src: '/assets/crazy/hero-2.jpg', alt: 'Sophisticated multi-tiered wedding cake with edible flowers' },
  { src: '/assets/crazy/hero-3.jpg', alt: 'Whimsical sculpted cake with playful design' },
  { src: '/assets/crazy/hero-4.jpg', alt: 'Fine edible detailing with sugar flowers and gold leaf' },
];

const cards: CardEntry[] = [
  { screen: Destination.About, image: '/assets/crazy/seema.png', keyId: 'about' },
  { screen: Destination.Gallery, image: '/assets/crazy/celebration-1.jpg', keyId: 'gallery' },
  { screen: Destination.Reviews, image: '/assets/crazy/awards.jpg', keyId: 'reviews' },
  { screen: Destination.Pricing, image: '/assets/crazy/pricing.jpg', keyId: 'pricing' },
];

export function HomeScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const isWide = width >= 720;
  const heroHeight = isWide ? 560 : Math.min(520, Math.max(440, Math.round(width * 0.95)));

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => {
        const next = (current + 1) % heroSlides.length;
        listRef.current?.scrollToOffset({ offset: next * width, animated: true });
        return next;
      });
    }, 6500);
    return () => clearInterval(timer);
  }, [width]);

  const rows = isWide ? [cards.slice(0, 2), cards.slice(2, 4)] : [cards];

  return (
    <ScrollView style={styles.screen}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <FlatList
          ref={listRef}
          horizontal
          data={heroSlides}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(event) =>
            setHeroIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <View style={{ width, height: heroHeight }}>
              <LocalImage src={item.src} alt={item.alt} />
            </View>
          )}
        />
        <View style={styles.heroOverlay} pointerEvents="none" />
        <View style={styles.heroContent} pointerEvents="box-none">
          <ScriptTitle
            title={text('home.hero.title')}
            size={isWide ? 52 : 38}
            color={palette.primaryForeground}
          />
          <Eyebrow text={text('home.hero.tagline')} color="rgba(254,251,251,0.92)" />
          <Text style={styles.heroBody}>{text('home.hero.body')}</Text>
          <View style={styles.heroButtons}>
            <PrimaryButton label={text('home.hero.cta.gallery')} onPress={() => navigate(Destination.Gallery)} />
            <PrimaryButton
              label={text('home.hero.cta.contact')}
              outline
              onPress={() => navigate(Destination.Contact)}
            />
          </View>
        </View>
        <View style={[styles.heroDots, { bottom: insets.bottom + 16 }]}>
          {heroSlides.map((slide, index) => (
            <View key={slide.src} style={[styles.dot, index === heroIndex ? styles.dotActive : null]} />
          ))}
        </View>
      </View>

      <View style={styles.teasers}>
        <SectionHeading title={text('home.teaser.title')} eyebrow={text('home.teaser.eyebrow')} />
        <View style={{ marginTop: 40, gap: 16 }}>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={{ flexDirection: 'row', gap: 16 }}>
              {row.map((card) => (
                <View key={card.keyId} style={{ flex: 1, maxWidth: isWide ? undefined : 560 }}>
                  <Pressable onPress={() => navigate(card.screen)} style={StyleSheet.flatten([styles.card, platformShadow])}>
                    <View style={styles.cardImage}>
                      <LocalImage src={card.image} alt={text(`home.card.${card.keyId}.alt`)} />
                    </View>
                    <View style={styles.cardBody}>
                      <ScriptTitle title={text(`home.card.${card.keyId}.title`)} size={28} align="left" />
                      <Text style={styles.cardBlurb}>{text(`home.card.${card.keyId}.blurb`)}</Text>
                      <View style={styles.cardLink}>
                        <Text style={styles.cardLinkText}>{text('home.cards.link')} →</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              ))}
              {isWide && row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.homeCta}>
          <Text style={styles.homeCtaText}>{text('home.cta.text')}</Text>
          <PrimaryButton label={text('home.cta.label')} onPress={() => navigate(Destination.Contact)} />
        </View>
      </View>

      <BrandFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.background },
  hero: { backgroundColor: palette.muted },
  heroOverlay: { ...absoluteFillObject, backgroundColor: palette.overlay },
  heroContent: {
    ...absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 6,
  },
  heroBody: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 24,
    color: palette.primaryForeground,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 640,
  },
  heroButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  heroDots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: palette.primaryForeground, width: 20 },
  teasers: { backgroundColor: palette.blush, paddingVertical: 64, paddingHorizontal: 20 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  cardImage: { height: 170, backgroundColor: palette.muted },
  cardBody: { padding: 24 },
  cardBlurb: {
    fontFamily: fonts.inter,
    fontSize: 14,
    lineHeight: 24,
    color: palette.mutedForeground,
    marginTop: 10,
  },
  cardLink: { flexDirection: 'row', marginTop: 16 },
  cardLinkText: { fontFamily: fonts.interMedium, fontSize: 13, color: palette.primary },
  homeCta: { alignItems: 'center', gap: 16, marginTop: 44 },
  homeCtaText: { fontFamily: fonts.inter, fontSize: 16, color: palette.mutedForeground },
});
