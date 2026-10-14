#!/usr/bin/env node

import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = path.join(root, "data", "crazy-cakes.db");
const outputDirectory = path.join(root, "dist-content");
const IMAGE_PREFIX = "/assets/crazy/";
const VIDEO_PREFIX = "/assets/videos/";
const MIME_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeKey(src) {
  const key = decodeURIComponent(String(src).split("?")[0]).replaceAll("\\", "/");
  const dot = key.lastIndexOf(".");
  const slash = key.lastIndexOf("/");
  return dot > slash ? `${key.slice(0, dot)}${key.slice(dot).toLowerCase()}` : key;
}

function mediaSourcePath(key) {
  const isImage = key.startsWith(IMAGE_PREFIX);
  const isVideo = key.startsWith(VIDEO_PREFIX);
  if (!isImage && !isVideo) throw new Error(`Unsupported media path in SQLite database: ${key}`);
  const rootDirectory = path.join(root, "assets", isImage ? "images" : "videos");
  const relativePath = key.slice((isImage ? IMAGE_PREFIX : VIDEO_PREFIX).length);
  const source = path.resolve(rootDirectory, ...relativePath.split("/"));
  const relative = path.relative(rootDirectory, source);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Media path escapes its mobile asset directory: ${key}`);
  }
  return { rootDirectory, source };
}

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

if (!existsSync(databasePath)) {
  throw new Error(
    `Mobile-owned database not found at ${databasePath}. Run "npm run content:import-db" once to copy the website DB.`,
  );
}

const db = new DatabaseSync(databasePath, { readOnly: true });
let mediaRows;
let stats;
try {
  const integrity = db.prepare("PRAGMA integrity_check").get();
  if (integrity?.integrity_check !== "ok") {
    throw new Error(`Mobile database failed integrity_check: ${integrity?.integrity_check ?? "no result"}`);
  }
  mediaRows = [
    ...db.prepare("SELECT src AS key FROM images ORDER BY id").all(),
    ...db.prepare("SELECT src AS key FROM videos ORDER BY id").all(),
  ];
  stats = {
    categories: db.prepare("SELECT count(*) AS count FROM categories").get().count,
    images: db.prepare("SELECT count(*) AS count FROM images").get().count,
    videos: db.prepare("SELECT count(*) AS count FROM videos").get().count,
    testimonials: db.prepare("SELECT count(*) AS count FROM testimonials WHERE published = 1").get().count,
    content: db.prepare("SELECT count(*) AS count FROM content").get().count,
    eventTypes: db.prepare("SELECT count(*) AS count FROM event_types").get().count,
    socialLinks: db.prepare("SELECT count(*) AS count FROM social_links WHERE active = 1").get().count,
  };
} finally {
  db.close();
}

if (stats.categories === 0) throw new Error("Mobile database contains no categories.");

const imagesDirectory = path.join(root, "assets", "images");
const videosDirectory = path.join(root, "assets", "videos");
const localMedia = [
  ...filesUnder(imagesDirectory)
    .filter((file) => MIME_TYPES[path.extname(file).toLowerCase()]?.startsWith("image/"))
    .map((source) => ({
      key: normalizeKey(
        `${IMAGE_PREFIX}${path.relative(imagesDirectory, source).replaceAll("\\", "/")}`,
      ),
      source,
    })),
  ...filesUnder(videosDirectory)
    .filter((file) => MIME_TYPES[path.extname(file).toLowerCase()] === "video/mp4")
    .map((source) => ({
      key: normalizeKey(
        `${VIDEO_PREFIX}${path.relative(videosDirectory, source).replaceAll("\\", "/")}`,
      ),
      source,
    })),
].sort((left, right) => left.key.localeCompare(right.key));
const localMediaByKey = new Map(localMedia.map((entry) => [entry.key, entry]));
const missing = mediaRows
  .map((row) => normalizeKey(row.key))
  .filter((key) => !localMediaByKey.has(key));
if (missing.length > 0) {
  throw new Error(`SQLite references media missing from the mobile project's assets: ${missing.join(", ")}`);
}

const media = localMedia.map(({ key, source }) => {
  const extension = path.extname(source).toLowerCase();
  const mime = MIME_TYPES[extension];
  const bytes = readFileSync(source);
  return {
    key,
    mime,
    bytes: bytes.length,
    sha256: sha256(bytes),
    source,
    output: path.join(outputDirectory, "media", key.replace(/^\/+/, "")),
  };
});

mkdirSync(outputDirectory, { recursive: true });
const packedDatabasePath = path.join(outputDirectory, "crazy-cakes.db");
const nextDatabasePath = `${packedDatabasePath}.next`;
rmSync(nextDatabasePath, { force: true });
const packer = new DatabaseSync(databasePath, { readOnly: true });
try {
  packer.exec(`VACUUM INTO '${nextDatabasePath.replace(/'/g, "''")}'`);
} finally {
  packer.close();
}
rmSync(packedDatabasePath, { force: true });
renameSync(nextDatabasePath, packedDatabasePath);

for (const entry of media) {
  mkdirSync(path.dirname(entry.output), { recursive: true });
  copyFileSync(entry.source, entry.output);
}

const databaseBytes = readFileSync(packedDatabasePath);
const databaseHash = sha256(databaseBytes);
const mediaVersionEntries = media.map(({ key, sha256: checksum }) => ({
  key,
  sha256: checksum,
}));
const manifest = {
  version: sha256(JSON.stringify({ database: databaseHash, media: mediaVersionEntries })),
  built: new Date().toISOString(),
  database: {
    file: "crazy-cakes.db",
    bytes: statSync(packedDatabasePath).size,
    sha256: databaseHash,
  },
  media: media.map(({ key, mime, bytes, sha256: checksum }) => ({
    key,
    file: `media${key}`,
    mime,
    bytes,
    sha256: checksum,
  })),
  stats: { ...stats, media: media.length },
};

writeFileSync(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Mobile content pack is ready at dist-content/ (${(databaseBytes.length / 1024).toFixed(1)} KB database, ` +
    `${(media.reduce((total, entry) => total + entry.bytes, 0) / 1024 / 1024).toFixed(1)} MB media)\n` +
    `  version=${manifest.version}\n` +
    `  categories=${stats.categories} images=${stats.images} videos=${stats.videos} ` +
    `testimonials=${stats.testimonials} content=${stats.content} eventTypes=${stats.eventTypes} ` +
    `socialLinks=${stats.socialLinks}\n` +
    "  Upload the contents of dist-content/ to the mobile content host.",
);
