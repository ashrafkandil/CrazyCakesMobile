import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LocalImage, PrimaryButton, SectionHeading } from '../components/ui';
import { fonts, palette } from '../theme';
import { Destination } from '../navigation/destinations';

const prices: [string, string][] = [
  ['Custom Cakes', '$150 & up'],
  ['Sculpted Cakes', '$300 & up'],
  ['Wedding Cakes', '$500 & up'],
  ['Cupcakes (per dozen)', '$40 & up'],
];

export function PricingScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const copy = (
    <View style={{ flex: 1, maxWidth: isWide ? undefined : 560 }}>
      <Text style={styles.body}>
        Our cakes and other goodies are thoughtfully designed for your special event and are
        individually priced. To give you an idea of what to expect, we have provided starting prices
        for each of our products.
      </Text>
      <View style={styles.table}>
        <View style={styles.tableTopBorder} />
        {prices.map(([label, price], index) => (
          <View key={label}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{label}</Text>
              <Text style={styles.priceValue}>{price}</Text>
            </View>
            <View style={index === prices.length - 1 ? styles.tableBottomBorder : styles.tableTopBorder} />
          </View>
        ))}
      </View>
      <View style={styles.quoteRow}>
        <Text style={styles.quoteText}>Have something else in mind?</Text>
        <PrimaryButton label="Get a quote" onPress={() => navigate(Destination.Contact)} />
      </View>
    </View>
  );

  const picture = (
    <View style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : '100%', maxWidth: 420 }}>
      <View style={styles.picture}>
        <LocalImage
          src="/assets/crazy/pricing.jpg"
          alt="Elegant wedding cake with multiple tiers and decorative elements"
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: palette.background }}>
      <View style={styles.page}>
        <SectionHeading title="Cake Pricing" eyebrow="Thoughtfully designed for your special event" />
        <View style={{ marginTop: 48 }}>
          {isWide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
              {copy}
              {picture}
            </View>
          ) : (
            <View style={{ gap: 36, alignItems: 'center' }}>
              {copy}
              {picture}
            </View>
          )}
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
