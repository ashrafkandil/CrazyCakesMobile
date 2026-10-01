import React from 'react';
import { Image } from 'expo-image';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eyebrowLetterSpacing, fonts, palette } from '../theme';
import { imageFor } from './images';
import { getSocialLinks } from '../db/database';

export function LocalImage({
  src,
  alt,
  style,
  resizeMode = 'contain',
}: {
  src: string;
  alt?: string;
  style?: object;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}) {
  const source = imageFor(src);
  if (!source) {
    if (__DEV__) console.warn(`No bundled image is registered for ${src}`);
    return <View style={[{ width: '100%', height: '100%', backgroundColor: palette.muted }, style]} />;
  }
  return (
    <Image
      source={source}
      alt={alt ?? ''}
      style={[{ width: '100%', height: '100%' }, style]}
      contentFit={resizeMode === 'stretch' ? 'fill' : resizeMode}
      cachePolicy="memory-disk"
      allowDownscaling
      onError={(event) => {
        if (__DEV__) console.error(`Failed to load image ${src}: ${event.error}`);
      }}
    />
  );
}

export function WatermarkPattern({ tileSize = 88, opacity = 0.055 }: { tileSize?: number; opacity?: number }) {
  const { width, height } = useWindowDimensions();
  const logo = imageFor('/assets/crazy/logo.png');
  if (!logo) return null;
  const columns = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => (
        <Image
          key={index}
          source={logo}
          contentFit="contain"
          cachePolicy="memory-disk"
          allowDownscaling
          style={{ width: tileSize, height: tileSize, opacity }}
        />
      ))}
    </View>
  );
}

export function ScriptTitle({
  title,
  size = 36,
  color = palette.primary,
  align = 'center',
  lineHeight,
}: {
  title: string;
  size?: number;
  color?: string;
  align?: 'center' | 'left';
  lineHeight?: number;
}) {
  return (
    <Text
      style={{
        fontFamily: fonts.script,
        fontSize: size,
        color,
        textAlign: align,
        lineHeight: lineHeight ?? Math.round(size * 1.25),
      }}
    >
      {title}
    </Text>
  );
}

export function Eyebrow({ text, color = palette.mutedForeground }: { text: string; color?: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.serif,
        fontSize: 11,
        letterSpacing: eyebrowLetterSpacing,
        color,
        textAlign: 'center',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Text>
  );
}

export function SectionHeading({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 20 }}>
      <ScriptTitle title={title} size={38} />
      <Eyebrow text={eyebrow} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  outline = false,
  wide = false,
}: {
  label: string;
  onPress: () => void;
  outline?: boolean;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignSelf: wide ? 'stretch' : 'auto',
          paddingVertical: 12,
          paddingHorizontal: 22,
          borderRadius: 999,
          alignItems: 'center',
          backgroundColor: outline ? 'transparent' : palette.primary,
          borderWidth: outline ? 1 : 0,
          borderColor: outline ? palette.primary : 'transparent',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.interMedium,
          fontSize: 15,
          color: outline ? palette.primary : palette.primaryForeground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SocialPill({
  label,
  url,
  dark = false,
}: {
  label: string;
  url: string;
  dark?: boolean;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={{
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: dark ? 'rgba(248,239,239,0.35)' : palette.border,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.interMedium,
          fontSize: 13,
          color: dark ? palette.footerForeground : palette.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BrandFooter() {
  const socialLinks = getSocialLinks();
  return (
    <View style={{ backgroundColor: palette.footer, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 56, height: 56 }}>
            <LocalImage src="/assets/crazy/logo.png" resizeMode="contain" />
          </View>
        </View>
        <View>
          <ScriptTitle title="Marwa Crazy Cakes" size={28} color={palette.footerForeground} align="left" />
          <Text
            style={{
              fontFamily: fonts.serif,
              fontSize: 10,
              letterSpacing: 2,
              color: 'rgba(248,239,239,0.7)',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Edible art. Unforgettable moments.
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {socialLinks.map((social) => (
          <SocialPill key={social.id} label={social.label} url={social.href} dark />
        ))}
      </View>
      <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: 'rgba(248,239,239,0.75)' }}>
        © 2026 Marwa Crazy Cakes. All rights reserved.
      </Text>
    </View>
  );
}

export function ScreenSafe({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: 'transparent' }}>{children}</View>;
}

export const platformShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
  default: {},
});

export function NavIcon({ name, size, color }: { name: keyof typeof Ionicons.glyphMap; size: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}
