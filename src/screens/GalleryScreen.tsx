import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LocalImage, PrimaryButton, SectionHeading } from '../components/ui';
import { fonts, palette } from '../theme';
import { GalleryImage, getGallery } from '../db/database';
import { Destination } from '../navigation/destinations';

export function GalleryScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<{ image: GalleryImage; images: GalleryImage[] } | null>(null);

  const gallery = useMemo(() => getGallery(category === 'all' ? undefined : category, page), [category, page]);
  const columns = isWide ? 3 : 2;
  const cellSize = Math.floor(((isWide ? 860 : width) - 40 - 12 * (columns - 1)) / columns);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center' }}>
        <SectionHeading title="Our Gallery" eyebrow="Portfolio of custom creations" />
        <Text style={styles.intro}>
          Explore our portfolio of custom creations, each one unique and crafted with passion. From
          intimate celebrations to grand events, see how we bring visions to life.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {[{ slug: 'all', title: 'All' }, ...gallery.categories].map((item) => {
            const active = gallery.activeCategory === item.slug;
            return (
              <Pressable
                key={item.slug}
                onPress={() => {
                  setCategory(item.slug);
                  setPage(1);
                }}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        {gallery.images.length === 0 ? (
          <Text style={styles.empty}>No cakes in this category yet — check back soon!</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32, maxWidth: isWide ? 900 : undefined }}>
            {gallery.images.map((image) => (
              <Pressable
                key={image.id}
                onPress={() => setLightbox({ image, images: gallery.images })}
                style={{ width: cellSize, height: Math.round((cellSize * 3) / 4), borderRadius: 10, overflow: 'hidden', backgroundColor: palette.muted }}
              >
                <LocalImage src={image.src} alt={image.alt} />
              </Pressable>
            ))}
          </View>
        )}

        {gallery.pageCount > 1 ? (
          <View style={styles.pagination}>
            <Pressable
              onPress={() => setPage(Math.max(1, gallery.page - 1))}
              disabled={gallery.page <= 1}
              style={styles.pageButton}
            >
              <Text style={[styles.pageButtonText, gallery.page <= 1 ? styles.pageTextDisabled : null]}>
                ‹ Previous
              </Text>
            </Pressable>
            <Text style={styles.pageInfo}>
              Page {gallery.page} of {gallery.pageCount} · {gallery.total} cakes
            </Text>
            <Pressable
              onPress={() => setPage(Math.min(gallery.pageCount, gallery.page + 1))}
              disabled={gallery.page >= gallery.pageCount}
              style={styles.pageButton}
            >
              <Text
                style={[styles.pageButtonText, gallery.page >= gallery.pageCount ? styles.pageTextDisabled : null]}
              >
                Next ›
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Ready to create your own masterpiece?</Text>
          <PrimaryButton label="Start Your Custom Order" onPress={() => navigate(Destination.Contact)} />
        </View>
      </ScrollView>

      <Modal
        visible={lightbox !== null}
        animationType="fade"
        onRequestClose={() => setLightbox(null)}
      >
        {lightbox ? (
          <View style={styles.lightbox}>
            <LightboxContent
              initialIndex={lightbox.images.findIndex((item) => item.id === lightbox.image.id)}
              images={lightbox.images}
              onClose={() => setLightbox(null)}
            />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

function LightboxContent({
  initialIndex,
  images,
  onClose,
}: {
  initialIndex: number;
  images: GalleryImage[];
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const listRef = React.useRef<FlatList<GalleryImage>>(null);
  const [index, setIndex] = useState(Math.max(0, initialIndex));
  const current = images[index];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.lightboxHeader}>
        <Text style={styles.lightboxCaption}>
          {current.alt} · {getCategoryTitle(current)}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.lightboxClose}>✕ Close</Text>
        </Pressable>
      </View>
      <FlatList
        ref={listRef}
        horizontal
        data={images}
        pagingEnabled
        initialScrollIndex={Math.max(0, initialIndex)}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, height: height - 140, alignItems: 'center', justifyContent: 'center' }}>
            <LocalImage src={item.src} alt={item.alt} resizeMode="contain" />
          </View>
        )}
      />
      <View style={styles.lightboxNav}>
        <Pressable
          onPress={() => {
            const next = (index - 1 + images.length) % images.length;
            setIndex(next);
            listRef.current?.scrollToOffset({ offset: next * width, animated: true });
          }}
          style={styles.pageButton}
        >
          <Text style={styles.pageButtonText}>‹ Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const next = (index + 1) % images.length;
            setIndex(next);
            listRef.current?.scrollToOffset({ offset: next * width, animated: true });
          }}
          style={styles.pageButton}
        >
          <Text style={styles.pageButtonText}>Next ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getCategoryTitle(image: GalleryImage): string {
  const match = image.slug.replace(/-/g, ' ');
  return match
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 26,
    color: palette.mutedForeground,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 720,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.secondary,
  },
  chipActive: { backgroundColor: palette.primary },
  chipText: { fontFamily: fonts.interMedium, fontSize: 13, color: palette.foreground },
  chipTextActive: { color: palette.primaryForeground },
  empty: {
    fontFamily: fonts.inter,
    fontSize: 15,
    color: palette.mutedForeground,
    marginVertical: 48,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 28,
  },
  pageButton: { paddingHorizontal: 12, paddingVertical: 8 },
  pageButtonText: { fontFamily: fonts.interMedium, fontSize: 14, color: palette.primary },
  pageTextDisabled: { color: palette.mutedForeground, opacity: 0.5 },
  pageInfo: { fontFamily: fonts.inter, fontSize: 13, color: palette.mutedForeground },
  cta: { alignItems: 'center', gap: 16, marginTop: 44 },
  ctaText: { fontFamily: fonts.inter, fontSize: 15, color: palette.mutedForeground },
  lightbox: { flex: 1, backgroundColor: palette.overlayStrong },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  lightboxCaption: {
    fontFamily: fonts.inter,
    fontSize: 13,
    color: palette.primaryForeground,
    flex: 1,
    marginRight: 12,
  },
  lightboxClose: { fontFamily: fonts.interMedium, fontSize: 14, color: palette.primaryForeground },
  lightboxNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 40,
  },
});
