import * as SQLite from 'expo-sqlite';
import seed from '../data/seed.json';

export const GALLERY_PAGE_SIZE = 6;
const SCHEMA_VERSION = 2;

export type GalleryCategory = { id: number; slug: string; title: string; sort: number };
export type GalleryImage = {
  id: number;
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  sort: number;
  featured: number;
  category_id: number;
  slug: string;
  categoryTitle: string;
};
export type GalleryVideo = {
  id: number;
  src: string;
  title: string;
  sort: number;
  category_id: number;
  slug: string;
  categoryTitle: string;
};
export type GalleryPage = {
  categories: GalleryCategory[];
  images: GalleryImage[];
  videos: GalleryVideo[];
  activeCategory: string;
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};
export type Testimonial = {
  id: number;
  author: string;
  initials: string;
  date: string;
  quote: string;
  rating: number;
};
export type SocialLink = {
  id: number;
  label: string;
  href: string;
  icon: string;
  sort: number;
  active: number;
};

type SeedContent = {
  categories: GalleryCategory[];
  images: GalleryImage[];
  videos: GalleryVideo[];
  testimonials: Testimonial[];
  content: Record<string, string>;
  eventTypes: string[];
  socialLinks: SocialLink[];
};

const typedSeed = seed as unknown as SeedContent;

let categoriesCache: GalleryCategory[] = [];
let imagesCache: GalleryImage[] = [];
let videosCache: GalleryVideo[] = [];
let testimonialsCache: Testimonial[] = [];
let contentCache: Record<string, string> = {};
let eventTypesCache: string[] = [];
let socialLinksCache: SocialLink[] = [];

const SCHEMA_SQL = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY,
      src TEXT NOT NULL,
      alt TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      sort INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY,
      src TEXT NOT NULL,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY,
      author TEXT NOT NULL,
      initials TEXT NOT NULL,
      review_date TEXT NOT NULL,
      quote TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      published INTEGER NOT NULL DEFAULT 1,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_types (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE,
      href TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
  `;

type Database = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

export async function initDatabase(): Promise<void> {
  const db = await SQLite.openDatabaseAsync('crazy-cakes.db');

  await db.execAsync(SCHEMA_SQL);
  await seedIfOutdated(db);
  await hydrateCaches(db);
}

async function seedIfOutdated(db: Database): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) {
    return;
  }

  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.execAsync(
      'DELETE FROM images; DELETE FROM videos; DELETE FROM testimonials; DELETE FROM event_types; DELETE FROM content; DELETE FROM social_links; DELETE FROM categories;'
    );

    for (const category of typedSeed.categories) {
      await db.runAsync(
        'INSERT INTO categories (id, slug, title, sort) VALUES (?, ?, ?, ?)',
        category.id,
        category.slug,
        category.title,
        category.sort
      );
    }
    for (const image of typedSeed.images) {
      await db.runAsync(
        'INSERT INTO images (id, src, alt, width, height, sort, featured, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        image.id,
        image.src,
        image.alt,
        image.width,
        image.height,
        image.sort,
        image.featured,
        image.category_id
      );
    }
    for (const video of typedSeed.videos) {
      await db.runAsync(
        'INSERT INTO videos (id, src, title, category_id, sort) VALUES (?, ?, ?, ?, ?)',
        video.id,
        video.src,
        video.title,
        video.category_id,
        video.sort
      );
    }
    for (const testimonial of typedSeed.testimonials) {
      await db.runAsync(
        'INSERT INTO testimonials (id, author, initials, review_date, quote, rating, published, sort) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
        testimonial.id,
        testimonial.author,
        testimonial.initials,
        testimonial.date,
        testimonial.quote,
        testimonial.rating,
        testimonial.id - 1
      );
    }
    for (const [key, value] of Object.entries(typedSeed.content)) {
      await db.runAsync('INSERT INTO content (key, value) VALUES (?, ?)', key, value);
    }
    for (const [index, label] of typedSeed.eventTypes.entries()) {
      await db.runAsync('INSERT INTO event_types (label, sort) VALUES (?, ?)', label, index);
    }
    for (const socialLink of typedSeed.socialLinks) {
      await db.runAsync(
        'INSERT INTO social_links (id, label, href, icon, sort, active) VALUES (?, ?, ?, ?, ?, ?)',
        socialLink.id,
        socialLink.label,
        socialLink.href,
        socialLink.icon,
        socialLink.sort,
        socialLink.active
      );
    }

    await db.execAsync('COMMIT');
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  } catch (error) {
    await db.execAsync('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

async function hydrateCaches(db: Database): Promise<void> {
  categoriesCache = await db.getAllAsync<GalleryCategory>(
    'SELECT id, slug, title, sort FROM categories ORDER BY sort'
  );
  imagesCache = await db.getAllAsync<GalleryImage>(
    `SELECT i.id, i.src, i.alt, i.width, i.height, i.sort, i.featured, i.category_id, c.slug, c.title AS categoryTitle
     FROM images i JOIN categories c ON c.id = i.category_id
     ORDER BY i.sort, i.id`
  );
    videosCache = await db.getAllAsync<GalleryVideo>(
    `SELECT v.id, v.src, v.title, v.sort, v.category_id, c.slug, c.title AS categoryTitle
      FROM videos v JOIN categories c ON c.id = v.category_id
      ORDER BY v.sort, v.id`
    );
  testimonialsCache = await db.getAllAsync<Testimonial>(
    `SELECT id, author, initials, review_date AS date, quote, rating
     FROM testimonials WHERE published = 1 ORDER BY sort, id`
  );
  const contentRows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM content'
  );
  contentCache = Object.fromEntries(contentRows.map((row) => [row.key, row.value]));
  eventTypesCache = (
    await db.getAllAsync<{ label: string }>('SELECT label FROM event_types ORDER BY sort, id')
  ).map((row) => row.label);
  socialLinksCache = await db.getAllAsync<SocialLink>(
    'SELECT id, label, href, icon, sort, active FROM social_links WHERE active = 1 ORDER BY sort, id'
  );
}

export function getContent(): Record<string, string> {
  return contentCache;
}

export function text(key: string): string {
  return contentCache[key] ?? `Missing content slot "${key}"`;
}

export function getTestimonials(): Testimonial[] {
  return testimonialsCache;
}

export function getEventTypes(): string[] {
  return eventTypesCache;
}

export function getSocialLinks(): SocialLink[] {
  return socialLinksCache;
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  let state = 2166136261;
  for (const character of seed) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const item = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = item;
  }
  return shuffled;
}

export function getGallery(category?: string, page = 1, shuffleSeed = 'gallery-default'): GalleryPage {
  const active = category && category !== 'all' ? category : null;
  const filtered = active ? imagesCache.filter((image) => image.slug === active) : imagesCache;
  const ordered = active ? filtered : shuffleWithSeed(filtered, shuffleSeed);
  const filteredVideos = active ? videosCache.filter((video) => video.slug === active) : videosCache;
  const total = ordered.length;
  const pageCount = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const offset = (safePage - 1) * GALLERY_PAGE_SIZE;

  return {
    categories: categoriesCache,
    images: ordered.slice(offset, offset + GALLERY_PAGE_SIZE),
    videos: filteredVideos,
    activeCategory: active ?? 'all',
    page: safePage,
    pageSize: GALLERY_PAGE_SIZE,
    total,
    pageCount,
  };
}
