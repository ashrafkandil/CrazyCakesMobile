import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
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
import { LocalImage, PrimaryButton, SectionHeading, WatermarkPattern } from '../components/ui';
import { fonts, palette } from '../theme';
import { GalleryImage, GalleryVideo, getGallery, text } from '../db/database';
import { Destination } from '../navigation/destinations';
import { videoFor } from '../components/images';

export function GalleryScreen({ navigate }: { navigate: (screen: Destination) => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [shuffleSeed, setShuffleSeed] = useState(() => `${Date.now()}-${Math.random()}`);
  const [lightbox, setLightbox] = useState<{ image: GalleryImage; images: GalleryImage[] } | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const gallery = useMemo(
    () => getGallery(category === 'all' ? undefined : category, page, shuffleSeed),
    [category, page, shuffleSeed],
  );
  const columns = isWide ? 3 : 2;
  const cellSize = Math.floor(((isWide ? 860 : width) - 40 - 12 * (columns - 1)) / columns);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView style={{ backgroundColor: 'transparent' }} contentContainerStyle={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center' }}>
        <SectionHeading title={text('gallery.title')} eyebrow={text('gallery.eyebrow')} />
        <Text style={styles.intro}>{text('gallery.description')}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {[{ slug: 'all', title: text('gallery.allCategory') }, ...gallery.categories].map((item) => {
            const active = gallery.activeCategory === item.slug;
            return (
              <Pressable
                key={item.slug}
                onPress={() => {
                  setCategory(item.slug);
                  setPage(1);
                  if (item.slug === 'all') setShuffleSeed(`${Date.now()}-${Math.random()}`);
                }}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        {gallery.images.length === 0 ? (
          <Text style={styles.empty}>{text('gallery.empty')}</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 32, maxWidth: isWide ? 900 : undefined }}>
            {gallery.images.map((image) => (
              <Pressable
                key={image.id}
                onPress={() => setLightbox({ image, images: gallery.images })}
                style={[styles.imageTile, { width: cellSize, height: Math.round((cellSize * 3) / 4) }]}
              >
                <WatermarkPattern tileSize={48} opacity={0.08} />
                <LocalImage src={image.src} alt={image.alt} resizeMode="contain" />
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
                {text('gallery.previous')}
              </Text>
            </Pressable>
            <Text style={styles.pageInfo}>
              {text('gallery.pageStatus')
                .replace('{page}', String(gallery.page))
                .replace('{pageCount}', String(gallery.pageCount))
                .replace('{total}', String(gallery.total))}
            </Text>
            <Pressable
              onPress={() => setPage(Math.min(gallery.pageCount, gallery.page + 1))}
              disabled={gallery.page >= gallery.pageCount}
              style={styles.pageButton}
            >
              <Text
                style={[styles.pageButtonText, gallery.page >= gallery.pageCount ? styles.pageTextDisabled : null]}
              >
                {text('gallery.next')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {gallery.videos.length > 0 ? (
          <View style={styles.videoSection}>
            <SectionHeading title={text('gallery.videoTitle')} eyebrow={text('gallery.videoEyebrow')} />
            <Text style={styles.videoIntro}>{text('gallery.videoDescription')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' }}>
              {gallery.videos.map((video) => (
                <VideoTile
                  key={video.id}
                  video={video}
                  width={cellSize}
                  onPress={() => setVideoIndex(gallery.videos.findIndex((item) => item.id === video.id))}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>{text('gallery.ctaText')}</Text>
          <PrimaryButton label={text('gallery.ctaLabel')} onPress={() => navigate(Destination.Contact)} />
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

      <Modal visible={videoIndex !== null} animationType="fade" onRequestClose={() => setVideoIndex(null)}>
        {videoIndex !== null ? (
          <VideoLightbox
            videos={gallery.videos}
            initialIndex={videoIndex}
            onClose={() => setVideoIndex(null)}
          />
        ) : null}
      </Modal>
    </View>
  );
}

function VideoTile({
  video,
  width,
  onPress,
}: {
  video: GalleryVideo;
  width: number;
  onPress: () => void;
}) {
  const poster = video.slug === 'wedding'
    ? '/assets/crazy/Wedding/0_IMG_4922.JPEG'
    : '/assets/crazy/Celebrations/0_IMG_3530.JPEG';

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={video.title}
      style={[styles.videoTile, { width, height: Math.round(width * 3 / 4) }]}
    >
      <WatermarkPattern tileSize={48} opacity={0.08} />
      <LocalImage src={poster} alt={video.title} resizeMode="cover" />
      <View style={styles.videoOverlay} pointerEvents="none">
        <Ionicons name="play-circle" size={48} color={palette.primaryForeground} />
      </View>
      <View style={styles.videoTitleBar} pointerEvents="none">
        <Text style={styles.videoTitle}>{video.title}</Text>
      </View>
    </Pressable>
  );
}

function VideoLightbox({
  videos,
  initialIndex,
  onClose,
}: {
  videos: GalleryVideo[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = videos[index];
  const source = videoFor(current.src) ?? null;
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    if (source === null && __DEV__) console.warn(`No bundled video is registered for ${current.src}`);
    const subscription = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' && __DEV__) {
        console.error(`Failed to load video ${current.src}: ${error?.message ?? 'Unknown video error'}`);
      }
    });
    return () => subscription.remove();
  }, [current.src, player, source]);

  function showVideo(step: number) {
    const nextIndex = (index + step + videos.length) % videos.length;
    setIndex(nextIndex);
    const nextSource = videoFor(videos[nextIndex]!.src);
    if (nextSource !== undefined) player.replace(nextSource);
    player.play();
  }

  return (
    <View style={styles.videoLightbox}>
      <View style={styles.lightboxHeader}>
        <Text style={styles.lightboxCaption}>
          {current.title} · {current.categoryTitle}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.lightboxClose}>✕ {text('gallery.closeVideo')}</Text>
        </Pressable>
      </View>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: true }}
      />
      <View style={styles.lightboxNav}>
        <Pressable onPress={() => showVideo(-1)} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>{text('gallery.previousVideo')}</Text>
        </Pressable>
        <Pressable onPress={() => showVideo(1)} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>{text('gallery.nextVideo')}</Text>
        </Pressable>
      </View>
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
          {current.alt} · {current.categoryTitle}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.lightboxClose}>✕ {text('gallery.closeImage')}</Text>
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
          <Text style={styles.pageButtonText}>{text('gallery.previousImage')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const next = (index + 1) % images.length;
            setIndex(next);
            listRef.current?.scrollToOffset({ offset: next * width, animated: true });
          }}
          style={styles.pageButton}
        >
          <Text style={styles.pageButtonText}>{text('gallery.nextImage')}</Text>
        </Pressable>
      </View>
    </View>
  );
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
  imageTile: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.foreground,
    overflow: 'hidden',
    backgroundColor: palette.muted,
  },
  videoSection: { width: '100%', marginTop: 52, paddingTop: 36, borderTopWidth: 1, borderTopColor: palette.border, alignItems: 'center' },
  videoIntro: { fontFamily: fonts.inter, fontSize: 15, lineHeight: 26, color: palette.mutedForeground, textAlign: 'center', marginTop: 18, marginBottom: 28, maxWidth: 620 },
  videoTile: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.foreground,
    overflow: 'hidden',
    backgroundColor: palette.muted,
  },
  videoOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.overlaySoft },
  videoTitleBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.overlaySoft, paddingHorizontal: 12, paddingVertical: 8 },
  videoTitle: { fontFamily: fonts.interMedium, fontSize: 12, color: palette.primaryForeground },
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
  videoLightbox: { flex: 1, backgroundColor: palette.overlayStrong, paddingTop: 48, paddingBottom: 28 },
  videoPlayer: { flex: 1, marginHorizontal: 16 },
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
