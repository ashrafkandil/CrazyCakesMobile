import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LocalImage, PrimaryButton, SectionHeading } from '../components/ui';
import { fonts, palette } from '../theme';
import { text } from '../db/database';
import { Destination } from '../navigation/destinations';

const priceItems = ['custom', 'sculpted', 'wedding', 'cupcakes'] as const;

export function PricingScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const copy = (
    <View style={{ width: '100%', maxWidth: isWide ? 680 : 560 }}>
      <Text style={styles.body}>
        {text('pricing.intro')}
      </Text>
      <View style={styles.table}>
        <View style={styles.tableTopBorder} />
        {priceItems.map((item, index) => (
          <View key={item}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{text(`pricing.item.${item}.label`)}</Text>
              <Text style={styles.priceValue}>{text(`pricing.item.${item}.price`)}</Text>
            </View>
            <View style={index === priceItems.length - 1 ? styles.tableBottomBorder : styles.tableTopBorder} />
          </View>
        ))}
      </View>
      <View style={styles.quoteRow}>
        <Text style={styles.quoteText}>{text('pricing.quotePrompt')}</Text>
        <PrimaryButton label={text('pricing.quoteButton')} onPress={() => navigate(Destination.Contact)} />
      </View>
    </View>
  );

  const picture = (
    <View style={{ width: '100%', maxWidth: 420 }}>
      <View style={styles.picture}>
        <LocalImage
          src="/assets/crazy/pricing.jpeg"
          alt={text('pricing.imageAlt')}
          resizeMode="cover"
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: 'transparent' }}>
      <View style={styles.page}>
        <SectionHeading title={text('pricing.title')} eyebrow={text('pricing.eyebrow')} />
        <View style={{ marginTop: 48, gap: 36, alignItems: 'center' }}>
          {picture}
          {copy}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingVertical: 56, maxWidth: 900, width: '100%', alignSelf: 'center' },
  body: { fontFamily: fonts.inter, fontSize: 15, lineHeight: 30, color: palette.mutedForeground },
  table: { marginTop: 26 },
  tableTopBorder: { height: 1, backgroundColor: palette.border },
  tableBottomBorder: { height: 1, backgroundColor: palette.border },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  priceLabel: { fontFamily: fonts.serif, fontSize: 18, color: palette.foreground },
  priceValue: { fontFamily: fonts.interBold, fontSize: 15, color: palette.primary },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 16 },
  quoteText: { fontFamily: fonts.inter, fontSize: 14, color: palette.mutedForeground, flex: 1 },
  picture: { aspectRatio: 4 / 5, borderRadius: 12, overflow: 'hidden', backgroundColor: palette.muted },
});
