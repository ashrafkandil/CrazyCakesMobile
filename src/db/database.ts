import { Asset } from 'expo-asset';
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export const GALLERY_PAGE_SIZE = 6;

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

type Database = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;
type ContentCache = {
  categories: GalleryCategory[];
  images: GalleryImage[];
  videos: GalleryVideo[];
  testimonials: Testimonial[];
  content: Record<string, string>;
  eventTypes: string[];
  socialLinks: SocialLink[];
};
type ContentManifest = {
  version: string;
  database: { file: 'crazy-cakes.db'; bytes: number; sha256: string };
};

const DATABASE_NAME = 'crazy-cakes.db';
const BUNDLED_DATABASE_ASSET = require('../../data/crazy-cakes.db') as number;
const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_MOBILE_CONTENT_URL?.trim().replace(/\/+$/, '') ?? '';
const REQUIRED_TABLES = [
  'categories',
  'images',
  'videos',
  'testimonials',
  'content',
  'event_types',
  'social_links',
];
const EMPTY_CACHE: ContentCache = {
  categories: [],
  images: [],
  videos: [],
  testimonials: [],
  content: {},
  eventTypes: [],
  socialLinks: [],
};

let activeDatabase: Database | null = null;
let fallbackDatabase: Database | null = null;
let contentCache = EMPTY_CACHE;
let activeContentVersion = 'bundled';
let contentUpdateInFlight: Promise<boolean> | null = null;
const contentUpdateListeners = new Set<() => void>();

export async function initDatabase(): Promise<void> {
  await installBundledDatabaseIfNeeded();
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(`
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS mobile_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await validateDatabase(db);
  const bundledCache = await readContentCache(db);
  const installedVersion = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM mobile_meta WHERE key = 'content_version'",
  );
  let initialDatabase = db;
  let initialCache = bundledCache;
  activeContentVersion = 'bundled';
  fallbackDatabase = db;

  if (installedVersion && /^[a-f0-9]{64}$/.test(installedVersion.value)) {
    const cachedName = `mobile-content-${installedVersion.value}.db`;
    const cachedFile = new File(new Directory(SQLite.defaultDatabaseDirectory), cachedName);
    if (cachedFile.exists) {
      let cachedDatabase: Database | null = null;
      try {
        cachedDatabase = await SQLite.openDatabaseAsync(
          cachedName,
          undefined,
          SQLite.defaultDatabaseDirectory,
        );
        await validateDatabase(cachedDatabase);
        const cachedVersion = await cachedDatabase.getFirstAsync<{ value: string }>(
          "SELECT value FROM mobile_meta WHERE key = 'content_version'",
        );
        if (cachedVersion?.value !== installedVersion.value) {
          throw new Error('Cached database version does not match the saved content version.');
        }
        initialCache = await readContentCache(cachedDatabase);
        initialDatabase = cachedDatabase;
        activeContentVersion = installedVersion.value;
      } catch (error) {
        if (cachedDatabase) await cachedDatabase.closeAsync();
        cachedFile.delete();
        await db.runAsync("DELETE FROM mobile_meta WHERE key = 'content_version'");
        activeContentVersion = 'bundled';
        console.warn('Could not restore the last downloaded content; using the bundled database.', error);
      }
    } else {
      await db.runAsync("DELETE FROM mobile_meta WHERE key = 'content_version'");
      console.warn('Saved mobile content database is missing; using the bundled database.');
    }
  } else if (installedVersion) {
    await db.runAsync("DELETE FROM mobile_meta WHERE key = 'content_version'");
    console.warn('Discarded an invalid saved mobile content version.');
  }

  contentCache = initialCache;
  activeDatabase = initialDatabase;
  void checkForContentUpdates();
}

export function subscribeToContentUpdates(listener: () => void): () => void {
  contentUpdateListeners.add(listener);
  return () => contentUpdateListeners.delete(listener);
}

async function installBundledDatabaseIfNeeded(): Promise<void> {
  const sqliteDirectory = new Directory(SQLite.defaultDatabaseDirectory);
  sqliteDirectory.create({ idempotent: true, intermediates: true });
  const databaseFile = new File(sqliteDirectory, DATABASE_NAME);
  if (databaseFile.exists) return;

  const asset = await Asset.fromModule(BUNDLED_DATABASE_ASSET).downloadAsync();
  if (!asset.localUri) throw new Error('Bundled mobile SQLite database did not resolve to a local file.');
  const temporaryName = `${DATABASE_NAME}.installing`;
  const temporaryFile = new File(sqliteDirectory, temporaryName);
  if (temporaryFile.exists) temporaryFile.delete();
  try {
    await new File(asset.localUri).copy(temporaryFile);
    const stagingDatabase = await SQLite.openDatabaseAsync(
      temporaryName,
      undefined,
      SQLite.defaultDatabaseDirectory,
    );
    try {
      await validateDatabase(stagingDatabase);
    } finally {
      await stagingDatabase.closeAsync();
    }
    await temporaryFile.move(databaseFile);
  } catch (error) {
    temporaryFile.delete();
    throw error;
  }
}

export function checkForContentUpdates(): Promise<boolean> {
  if (!CONTENT_BASE_URL || !activeDatabase) return Promise.resolve(false);
  if (contentUpdateInFlight) return contentUpdateInFlight;

  contentUpdateInFlight = downloadContentUpdate().finally(() => {
    contentUpdateInFlight = null;
  });
  return contentUpdateInFlight;
}

async function downloadContentUpdate(): Promise<boolean> {
  try {
    const manifestUrl = new URL('manifest.json', `${CONTENT_BASE_URL}/`);
    const response = await fetch(manifestUrl.toString(), {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error(`Manifest request failed with HTTP ${response.status}.`);

    const manifest = parseManifest(await response.json());
    const current = await activeDatabase!.getFirstAsync<{ value: string }>(
      "SELECT value FROM mobile_meta WHERE key = 'content_version'",
    );
    if (current?.value === manifest.version) return false;

    const downloadDirectory = new Directory(Paths.cache, 'mobile-content-downloads');
    downloadDirectory.create({ idempotent: true, intermediates: true });

    const databaseUrl = new URL(manifest.database.file, `${CONTENT_BASE_URL}/`);
    databaseUrl.searchParams.set('version', manifest.version);
    const download = await File.downloadFileAsync(databaseUrl.toString(), downloadDirectory, {
      idempotent: true,
    });
    if (download.size !== manifest.database.bytes) {
      throw new Error(
        `Downloaded content database size mismatch (expected ${manifest.database.bytes}, received ${download.size}).`,
      );
    }

    const bytes = await download.bytes();
    const digest = new Uint8Array(
      await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes),
    );
    const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (sha256 !== manifest.database.sha256) {
      throw new Error('Downloaded content database failed SHA-256 verification.');
    }

    const sqliteDirectory = new Directory(SQLite.defaultDatabaseDirectory);
    sqliteDirectory.create({ idempotent: true, intermediates: true });
    const databaseName = `mobile-content-${manifest.version}.db`;
    const databaseFile = new File(sqliteDirectory, databaseName);
    if (databaseFile.exists) databaseFile.delete();
    await download.copy(databaseFile);
    download.delete();

    let nextDatabase: Database | null = null;
    try {
      nextDatabase = await SQLite.openDatabaseAsync(
        databaseName,
        undefined,
        SQLite.defaultDatabaseDirectory,
      );
      await validateDatabase(nextDatabase);
      await nextDatabase.execAsync(`
        CREATE TABLE IF NOT EXISTS mobile_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      await nextDatabase.runAsync(
        `INSERT INTO mobile_meta (key, value) VALUES ('content_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        manifest.version,
      );
      const nextCache = await readContentCache(nextDatabase);
      await fallbackDatabase?.runAsync(
        `INSERT INTO mobile_meta (key, value) VALUES ('content_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        manifest.version,
      );
      const previousDatabase = activeDatabase;
      activeDatabase = nextDatabase;
      contentCache = nextCache;
      activeContentVersion = manifest.version;
      nextDatabase = null;
      for (const listener of contentUpdateListeners) {
        try {
          listener();
        } catch (error) {
          console.error('A mobile content update listener failed.', error);
        }
      }
      if (previousDatabase && previousDatabase !== fallbackDatabase) {
        try {
          await previousDatabase.closeAsync();
        } catch (error) {
          console.warn('Updated mobile database is active, but the prior database did not close cleanly.', error);
        }
      }
      return true;
    } catch (error) {
      if (nextDatabase) await nextDatabase.closeAsync();
      databaseFile.delete();
      throw error;
    }
  } catch (error) {
    console.warn(
      'Unable to refresh mobile content; keeping the last valid local database.',
      error,
    );
    return false;
  }
}

function parseManifest(value: unknown): ContentManifest {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Mobile content manifest must be an object.');
  }
  const record = value as Record<string, unknown>;
  const database = record.database;
  if (
    typeof record.version !== 'string' ||
    !/^[a-f0-9]{64}$/.test(record.version) ||
    typeof database !== 'object' ||
    database === null
  ) {
    throw new Error('Mobile content manifest has an invalid version or database descriptor.');
  }
  const descriptor = database as Record<string, unknown>;
  if (
    descriptor.file !== DATABASE_NAME ||
    typeof descriptor.bytes !== 'number' ||
    !Number.isSafeInteger(descriptor.bytes) ||
    descriptor.bytes <= 0 ||
    typeof descriptor.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(descriptor.sha256)
  ) {
    throw new Error('Mobile content manifest has an invalid database descriptor.');
  }
  return {
    version: record.version,
    database: {
      file: DATABASE_NAME,
      bytes: descriptor.bytes,
      sha256: descriptor.sha256,
    },
  };
}

async function validateDatabase(db: Database): Promise<void> {
  const integrity = await db.getFirstAsync<{ integrity_check: string }>('PRAGMA integrity_check');
  if (integrity?.integrity_check !== 'ok') {
    throw new Error(`SQLite integrity check failed: ${integrity?.integrity_check ?? 'no result'}.`);
  }
  for (const table of REQUIRED_TABLES) {
    await db.getFirstAsync(`SELECT 1 FROM ${table} LIMIT 0`);
  }
  const categories = await db.getFirstAsync<{ count: number }>(
    'SELECT count(*) AS count FROM categories',
  );
  if (!categories || categories.count === 0) {
    throw new Error('Mobile content database contains no categories.');
  }
}

async function readContentCache(db: Database): Promise<ContentCache> {
  const categories = await db.getAllAsync<GalleryCategory>(
    'SELECT id, slug, title, sort FROM categories ORDER BY sort',
  );
  const images = await db.getAllAsync<GalleryImage>(
    `SELECT i.id, i.src, i.alt, i.width, i.height, i.sort, i.featured, i.category_id,
            c.slug, c.title AS categoryTitle
     FROM images i JOIN categories c ON c.id = i.category_id
     ORDER BY i.sort, i.id`,
  );
  const videos = await db.getAllAsync<GalleryVideo>(
    `SELECT v.id, v.src, v.title, v.sort, v.category_id, c.slug, c.title AS categoryTitle
     FROM videos v JOIN categories c ON c.id = v.category_id
     ORDER BY v.sort, v.id`,
  );
  const testimonials = await db.getAllAsync<Testimonial>(
    `SELECT id, author, initials, review_date AS date, quote, rating
     FROM testimonials WHERE published = 1 ORDER BY sort, id`,
  );
  const contentRows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM content',
  );
  const eventTypes = (
    await db.getAllAsync<{ label: string }>(
      'SELECT label FROM event_types ORDER BY sort, id',
    )
  ).map((row) => row.label);
  const socialLinks = await db.getAllAsync<SocialLink>(
    `SELECT id, label, href, icon, sort, active
     FROM social_links WHERE active = 1 ORDER BY sort, id`,
  );

  return {
    categories,
    images,
    videos,
    testimonials,
    content: Object.fromEntries(contentRows.map((row) => [row.key, row.value])),
    eventTypes,
    socialLinks,
  };
}

export function getContent(): Record<string, string> {
  return contentCache.content;
}

export function getContentVersion(): string {
  return activeContentVersion;
}

export function text(key: string): string {
  return contentCache.content[key] ?? `Missing content slot "${key}"`;
}

export function getTestimonials(): Testimonial[] {
  return contentCache.testimonials;
}

export function getEventTypes(): string[] {
  return contentCache.eventTypes;
}

export function getSocialLinks(): SocialLink[] {
  return contentCache.socialLinks;
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
  const filtered = active ? contentCache.images.filter((image) => image.slug === active) : contentCache.images;
  const ordered = active ? filtered : shuffleWithSeed(filtered, shuffleSeed);
  const filteredVideos = active
    ? contentCache.videos.filter((video) => video.slug === active)
    : contentCache.videos;
  const total = ordered.length;
  const pageCount = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const offset = (safePage - 1) * GALLERY_PAGE_SIZE;

  return {
    categories: contentCache.categories,
    images: ordered.slice(offset, offset + GALLERY_PAGE_SIZE),
    videos: filteredVideos,
    activeCategory: active ?? 'all',
    page: safePage,
    pageSize: GALLERY_PAGE_SIZE,
    total,
    pageCount,
  };
}
