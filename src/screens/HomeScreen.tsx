import React, { useEffect, useRef } from 'react';
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
  { screen: Destination.About, image: '/assets/crazy/Marwa.png', keyId: 'about' },
  { screen: Destination.Gallery, image: '/assets/crazy/celebration-1.JPEG', keyId: 'gallery' },
  { screen: Destination.Reviews, image: '/assets/crazy/Testimony.png', keyId: 'reviews' },
  { screen: Destination.Pricing, image: '/assets/crazy/pricing.jpeg', keyId: 'pricing' },
];

function TeaserCard({
  card,
  navigate,
  wide,
}: {
  card: CardEntry;
  navigate: (screen: Destination) => void;
  wide: boolean;
}) {
  return (
    <Pressable
      onPress={() => navigate(card.screen)}
      style={StyleSheet.flatten([styles.card, { width: wide ? '48%' : '100%' }, platformShadow])}
    >
      <View style={styles.cardImage}>
        <LocalImage src={card.image} alt={text(`home.card.${card.keyId}.alt`)} resizeMode="stretch" />
      </View>
      <View style={styles.cardBody}>
        <ScriptTitle title={text(`home.card.${card.keyId}.title`)} size={28} align="left" />
        <Text style={styles.cardBlurb}>{text(`home.card.${card.keyId}.blurb`)}</Text>
        <View style={styles.cardLink}>
          <Text style={styles.cardLinkText}>{text('home.cards.link')} →</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const heroIndexRef = useRef(0);
  const isWide = width >= 720;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (heroIndexRef.current + 1) % heroSlides.length;
      heroIndexRef.current = next;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }, 6500);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <ScrollView style={styles.screen}>
          <View style={[styles.hero, { height: height - insets.top, marginTop: insets.top }]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <FlatList
            ref={listRef}
            horizontal
            data={heroSlides}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(event) => {
              heroIndexRef.current = Math.round(event.nativeEvent.contentOffset.x / width);
            }}
            renderItem={({ item }) => (
              <View style={{ width, height: '100%' }}>
                 <LocalImage src={item.src} alt={item.alt} resizeMode="cover" />
              </View>
            )}
          />
        </View>
        <View style={styles.heroOverlay} pointerEvents="none" />
        <View
          style={[
            styles.heroContent,
            { paddingTop: 72, paddingBottom: insets.bottom + 40 },
          ]}
          pointerEvents="box-none"
        >
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
               onPress={() => navigate(Destination.Contact)}
             />
          </View>
        </View>
      </View>

      <View style={styles.teasers}>
        <SectionHeading title={text('home.teaser.title')} eyebrow={text('home.teaser.eyebrow')} />
        <View style={[styles.cardList, isWide ? styles.cardListWide : null]}>
          {cards.map((card) => (
            <TeaserCard key={card.keyId} card={card} navigate={navigate} wide={isWide} />
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
  screen: { backgroundColor: 'transparent' },
  hero: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroOverlay: { ...absoluteFillObject, backgroundColor: palette.overlay },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 6,
  },
     heroBody: {
       fontFamily: fonts.inter,
       fontSize: 15,
       lineHeight: 24,
       // Use the same dark primary color as the title
       color: palette.primary,
       textAlign: 'center',
       marginTop: 12,
       maxWidth: 640,
     },
  heroButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
   teasers: { backgroundColor: 'transparent', paddingVertical: 24, paddingHorizontal: 20 },
  cardList: { marginTop: 40, gap: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
  cardListWide: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: palette.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cardImage: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden' },
  cardBody: {
    padding: 24,
  },
  
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