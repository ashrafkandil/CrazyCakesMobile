import * as SQLite from 'expo-sqlite';
import seed from '../data/seed.json';

export const GALLERY_PAGE_SIZE = 6;
const SCHEMA_VERSION = 1;

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
};
export type GalleryPage = {
  categories: GalleryCategory[];
  images: GalleryImage[];
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

type SeedContent = {
  categories: GalleryCategory[];
  images: GalleryImage[];
  testimonials: Testimonial[];
  content: Record<string, string>;
  eventTypes: string[];
};

const typedSeed = seed as unknown as SeedContent;

let categoriesCache: GalleryCategory[] = [];
let imagesCache: GalleryImage[] = [];
let testimonialsCache: Testimonial[] = [];
let contentCache: Record<string, string> = {};
let eventTypesCache: string[] = [];

export async function initDatabase(): Promise<void> {
  const db = await SQLite.openDatabaseAsync('crazy-cakes.db');

  await db.execAsync(`
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
    CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
  `);

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < SCHEMA_VERSION) {
    await db.execAsync('BEGIN TRANSACTION; DELETE FROM categories; DELETE FROM images; DELETE FROM testimonials; DELETE FROM content; DELETE FROM event_types;');
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
    typedSeed.eventTypes.forEach(async (label, index) => {
      await db.runAsync('INSERT INTO event_types (label, sort) VALUES (?, ?)', label, index);
    });
    await db.execAsync('COMMIT;');
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  categoriesCache = await db.getAllAsync<GalleryCategory>(
    'SELECT id, slug, title, sort FROM categories ORDER BY sort'
  );
  imagesCache = await db.getAllAsync<GalleryImage>(
    `SELECT i.id, i.src, i.alt, i.width, i.height, i.sort, i.featured, i.category_id, c.slug
     FROM images i JOIN categories c ON c.id = i.category_id
     ORDER BY i.sort, i.id`
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

export function getGallery(category?: string, page = 1): GalleryPage {
  const active = category && category !== 'all' ? category : null;
  const filtered = active ? imagesCache.filter((image) => image.slug === active) : imagesCache;
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const offset = (safePage - 1) * GALLERY_PAGE_SIZE;

  return {
    categories: categoriesCache,
    images: filtered.slice(offset, offset + GALLERY_PAGE_SIZE),
    activeCategory: active ?? 'all',
    page: safePage,
    pageSize: GALLERY_PAGE_SIZE,
    total,
    pageCount,
  };
}
