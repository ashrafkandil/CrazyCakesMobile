import { TextStyle } from 'react-native';

export const palette = {
  background: '#FDFDFD',
  foreground: '#2F2322',
  card: '#FFFFFF',
  primary: '#E58F92',
  primaryForeground: '#FEFBFB',
  secondary: '#F5CCCD',
  muted: '#FAF1F1',
  mutedForeground: '#766867',
  border: '#EADAD9',
  blush: '#FFF4F4',
  gold: '#D29E25',
  overlay: 'rgba(13, 6, 5, 0.58)',
  overlaySoft: 'rgba(13, 6, 5, 0.35)',
  overlayStrong: 'rgba(13, 6, 5, 0.65)',
  footer: '#231716',
  footerForeground: '#F8EFEF',
};

export const fonts = {
  script: 'DancingScript_400Regular',
  scriptSemiBold: 'DancingScript_600SemiBold',
  serif: 'CrimsonText_400Regular',
  serifItalic: 'CrimsonText_400Regular_Italic',
  serifSemiBold: 'CrimsonText_600SemiBold',
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
};

export const eyebrowLetterSpacing = 2.9;

export const absoluteFillObject = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export const absoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

export type BodyText = TextStyle & { color: string };

export const textStyles: Record<string, TextStyle & { color?: string }> = {
  body: { fontFamily: fonts.inter, fontSize: 15, lineHeight: 26, color: palette.mutedForeground },
  bodyCenter: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 26,
    color: palette.mutedForeground,
    textAlign: 'center',
  },
  bodyLarge: { fontFamily: fonts.inter, fontSize: 16, lineHeight: 28 },
};
