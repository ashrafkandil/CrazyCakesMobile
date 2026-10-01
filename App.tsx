import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  DancingScript_400Regular,
  DancingScript_500Medium,
  DancingScript_600SemiBold,
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import {
  CrimsonText_400Regular,
  CrimsonText_400Regular_Italic,
  CrimsonText_600SemiBold,
} from '@expo-google-fonts/crimson-text';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { initDatabase } from './src/db/database';
import { AppRoot } from './src/navigation/AppRoot';
import { LocalImage } from './src/components/ui';
import { fonts, palette } from './src/theme';

const SPLASH_DURATION = 1000;

async function loadAssets(): Promise<void> {
  await Promise.all([
    Font.loadAsync({
      DancingScript_400Regular,
      DancingScript_500Medium,
      DancingScript_600SemiBold,
      DancingScript_700Bold,
      CrimsonText_400Regular,
      CrimsonText_400Regular_Italic,
      CrimsonText_600SemiBold,
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
    }),
    initDatabase(),
  ]);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setReady(false);
    setShowSplash(true);
    loadAssets()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('Failed to bootstrap app', cause);
        setReady(false);
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>{error.message}</Text>
          <Pressable onPress={() => setAttempt((count) => count + 1)} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (!ready || showSplash) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <View style={styles.splashLogoCircle}>
            <View style={styles.splashLogoInner}>
              <LocalImage src="/assets/crazy/logo.png" alt="Marwa Crazy Cakes" resizeMode="contain" />
            </View>
          </View>
          <Text style={styles.splashBrand}>Marwa Crazy Cakes</Text>
          <Text style={styles.splashTagline}>Edible art. Unforgettable moments.</Text>
          {!ready ? (
            <ActivityIndicator size="small" color={palette.primaryForeground} style={{ marginTop: 28 }} />
          ) : null}
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppRoot />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: palette.footer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  splashLogoInner: { width: 120, height: 120 },
  splashBrand: {
    fontFamily: fonts.script,
    fontSize: 40,
    color: palette.primaryForeground,
    marginTop: 26,
    textAlign: 'center',
  },
  splashTagline: {
    fontFamily: fonts.serif,
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(248,239,239,0.75)',
    textTransform: 'uppercase',
    marginTop: 10,
    textAlign: 'center',
  },
  errorTitle: { fontFamily: fonts.script, fontSize: 30, color: palette.primaryForeground },
  errorBody: {
    fontFamily: fonts.inter,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(248,239,239,0.75)',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 32,
  },
  retry: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: palette.primary,
  },
  retryText: { fontFamily: fonts.interMedium, fontSize: 15, color: palette.primaryForeground },
});
