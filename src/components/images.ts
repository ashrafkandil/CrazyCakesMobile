import { ImageRequireSource } from 'react-native';

const registry: Record<string, number> = {
  'awards.jpg': require('../../assets/images/awards.jpg'),
  'celebration-1.jpg': require('../../assets/images/celebration-1.jpg'),
  'celebration-2.jpg': require('../../assets/images/celebration-2.jpg'),
  'cupcakes-1.jpg': require('../../assets/images/cupcakes-1.jpg'),
  'hero-1.jpg': require('../../assets/images/hero-1.jpg'),
  'hero-2.jpg': require('../../assets/images/hero-2.jpg'),
  'hero-3.jpg': require('../../assets/images/hero-3.jpg'),
  'hero-4.jpg': require('../../assets/images/hero-4.jpg'),
  'kids-1.jpg': require('../../assets/images/kids-1.jpg'),
  'kids-2.jpg': require('../../assets/images/kids-2.jpg'),
  'logo.png': require('../../assets/images/logo.png'),
  'pricing.jpg': require('../../assets/images/pricing.jpg'),
  'sculpted-1.jpg': require('../../assets/images/sculpted-1.jpg'),
  'sculpted-2.jpg': require('../../assets/images/sculpted-2.jpg'),
  'seema.png': require('../../assets/images/seema.png'),
  'wedding-1.jpg': require('../../assets/images/wedding-1.jpg'),
  'wedding-2.jpg': require('../../assets/images/wedding-2.jpg'),
};

export function imageFor(src: string): ImageRequireSource | undefined {
  const base = src.split('/').pop() ?? '';
  const resource = registry[base];
  return resource === undefined ? undefined : (resource as ImageRequireSource);
}
