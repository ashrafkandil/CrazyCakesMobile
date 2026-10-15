import React, { useEffect, useState } from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalImage, WatermarkPattern } from '../components/ui';
import { fonts, palette } from '../theme';
import { Destination, destinations } from './destinations';
import { HomeScreen } from '../screens/HomeScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { GalleryScreen } from '../screens/GalleryScreen';
import { ReviewsScreen } from '../screens/ReviewsScreen';
import { PricingScreen } from '../screens/PricingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { AvatarAssistant } from '../assistant/AvatarAssistant';
import type { AssistantPage } from '../assistant/shared';
import { checkForContentUpdates, subscribeToContentUpdates } from '../db/database';

/** Which assistant "page" a screen reports to the model. */
const SCREEN_PAGE: Record<Destination, AssistantPage> = {
  [Destination.Home]: '/',
  [Destination.About]: '/about',
  [Destination.Gallery]: '/gallery',
  [Destination.Reviews]: '/reviews',
  [Destination.Pricing]: '/pricing',
  [Destination.Contact]: '/contact',
};

export function AppRoot() {
  const [current, setCurrent] = useState<Destination>(Destination.Home);
  const [galleryRevision, setGalleryRevision] = useState(0);
  const [contentRevision, setContentRevision] = useState(0);
  const [galleryCategory, setGalleryCategory] = useState<string | undefined>(undefined);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const useSidebar = width >= 720;

  const navigate = (screen: Destination, options?: { galleryCategory?: string }) => {
    if (screen === Destination.Gallery) {
      setGalleryCategory(options?.galleryCategory);
      // Re-mount the gallery so a fresh assistant request resets category/page.
      setGalleryRevision((revision) => revision + 1);
    }
    setCurrent(screen);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (current === Destination.Home) {
        return false;
      }
      setCurrent(Destination.Home);
      return true;
    });
    return () => subscription.remove();
  }, [current]);

  useEffect(() => {
    const unsubscribe = subscribeToContentUpdates(() => {
      setContentRevision((revision) => revision + 1);
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void checkForContentUpdates();
    });
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  const screen = () => {
    switch (current) {
      case Destination.Home:
        return <HomeScreen navigate={navigate} />;
      case Destination.About:
        return <AboutScreen navigate={navigate} />;
      case Destination.Gallery:
        return <GalleryScreen key={galleryRevision} navigate={navigate} initialCategory={galleryCategory} />;
      case Destination.Reviews:
        return <ReviewsScreen />;
      case Destination.Pricing:
        return <PricingScreen navigate={navigate} />;
      case Destination.Contact:
        return <ContactScreen />;
    }
  };

  const assistant = <AvatarAssistant page={SCREEN_PAGE[current]} navigate={navigate} />;

  if (useSidebar) {
    return (
      <View style={styles.row}>
        <WatermarkPattern />
        <View style={[styles.sidebar, { paddingTop: insets.top + 20 }]}>
          <View style={styles.sidebarLogo}>
            <View style={styles.sidebarLogoCircle}>
              <LocalImage src="/assets/crazy/logo.png" resizeMode="contain" />
            </View>
            <Text style={styles.sidebarBrand}>Marwa Crazy Cakes</Text>
          </View>
          <ScrollView style={styles.sidebarNav} contentContainerStyle={styles.sidebarNavContent}>
            {destinations.map((item) => {
              const active = current === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => navigate(item.id)}
                  style={[styles.sidebarItem, active ? styles.sidebarItemActive : null]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? palette.primary : palette.mutedForeground}
                  />
                  <Text style={[styles.sidebarLabel, active ? styles.sidebarLabelActive : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View key={contentRevision} style={styles.detail}>{screen()}</View>
        {assistant}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative', backgroundColor: palette.background }}>
      <WatermarkPattern />
      <View key={contentRevision} style={styles.detail}>{screen()}</View>
      {assistant}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {destinations.map((item) => {
          const active = current === item.id;
          return (
            <Pressable key={item.id} onPress={() => navigate(item.id)} style={styles.tabItem}>
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? palette.primary : palette.mutedForeground}
              />
              <Text style={[styles.tabLabel, active ? styles.sidebarLabelActive : null]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', position: 'relative', backgroundColor: palette.background },
  sidebar: {
    width: 240,
    backgroundColor: palette.card,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    paddingHorizontal: 16,
    gap: 4,
  },
  sidebarLogo: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  sidebarNav: { flex: 1 },
  sidebarNavContent: { gap: 4, paddingBottom: 24 },
  sidebarLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  sidebarBrand: { fontFamily: fonts.script, fontSize: 22, color: palette.primary },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sidebarItemActive: { backgroundColor: palette.secondary },
  sidebarLabel: { fontFamily: fonts.interMedium, fontSize: 14, color: palette.foreground },
  sidebarLabelActive: { color: palette.primary, fontFamily: fonts.interSemiBold },
  detail: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontFamily: fonts.inter, fontSize: 10, color: palette.mutedForeground },
});
