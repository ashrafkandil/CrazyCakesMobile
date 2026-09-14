import { Ionicons } from '@expo/vector-icons';

export enum Destination {
  Home = 'home',
  About = 'about',
  Gallery = 'gallery',
  Reviews = 'reviews',
  Pricing = 'pricing',
  Contact = 'contact',
}

export type TabIconName = keyof typeof Ionicons.glyphMap;

export const destinations: { id: Destination; label: string; icon: TabIconName }[] = [
  { id: Destination.Home, label: 'Home', icon: 'home' },
  { id: Destination.About, label: 'About Us', icon: 'person-circle' },
  { id: Destination.Gallery, label: 'Gallery', icon: 'images' },
  { id: Destination.Reviews, label: 'Reviews', icon: 'star' },
  { id: Destination.Pricing, label: 'Pricing', icon: 'pricetags' },
  { id: Destination.Contact, label: 'Contact', icon: 'mail' },
];
