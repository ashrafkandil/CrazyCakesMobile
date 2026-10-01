import { DatabaseSync } from "node:sqlite";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDb = path.resolve(root, "..", "CrazyCakes", "data", "crazy-cakes.db");

const db = new DatabaseSync(sourceDb, { readOnly: true });

const seed = {
  categories: db.prepare("SELECT id, slug, title, sort FROM categories ORDER BY sort").all(),
  images: db.prepare(
    `SELECT i.id, i.src, i.alt, i.width, i.height, i.sort, i.featured, i.category_id, c.slug
     FROM images i JOIN categories c ON c.id = i.category_id
     ORDER BY i.sort, i.id`,
  ).all(),
  videos: db.prepare(
    `SELECT v.id, v.src, v.title, v.sort, v.category_id, c.slug
     FROM videos v JOIN categories c ON c.id = v.category_id
     ORDER BY v.sort, v.id`,
  ).all(),
  testimonials: db
    .prepare(
      "SELECT id, author, initials, review_date AS date, quote, rating FROM testimonials WHERE published = 1 ORDER BY sort, id",
    )
    .all(),
  content: Object.fromEntries(
    db.prepare("SELECT key, value FROM content ORDER BY key").all().map((row) => [row.key, row.value]),
  ),
  eventTypes: db.prepare("SELECT label FROM event_types ORDER BY sort, id").all().map((row) => row.label),
  socialLinks: db
    .prepare(
      "SELECT id, label, href, icon, sort, active FROM social_links WHERE active = 1 ORDER BY sort, id",
    )
    .all(),
};

db.close();

const target = path.join(root, "src", "data", "seed.json");
writeFileSync(target, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

const webRoot = path.resolve(root, "..", "CrazyCakes");
const webImageRoot = path.join(webRoot, "public", "assets", "crazy");
const webVideoRoot = path.join(webRoot, "public", "assets", "videos");
const mobileImageRoot = path.join(root, "assets", "images");
const mobileVideoRoot = path.join(root, "assets", "videos");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

rmSync(mobileImageRoot, { recursive: true, force: true });
rmSync(mobileVideoRoot, { recursive: true, force: true });
mkdirSync(mobileImageRoot, { recursive: true });
mkdirSync(mobileVideoRoot, { recursive: true });
cpSync(webVideoRoot, mobileVideoRoot, { recursive: true, force: true });

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

const images = filesUnder(webImageRoot)
  .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));
const videos = filesUnder(webVideoRoot)
  .filter((file) => path.extname(file).toLowerCase() === ".mp4")
  .sort((a, b) => a.localeCompare(b));
const imageEntries = images.map((file) => {
  const relativePath = path.relative(webImageRoot, file).replaceAll("\\", "/");
  const mobileRelativePath = relativePath.replace(/\.[^.]+$/, (extension) => extension.toLowerCase());
  const mobilePath = path.join(mobileImageRoot, mobileRelativePath);
  mkdirSync(path.dirname(mobilePath), { recursive: true });
  const temporaryPath = `${mobilePath}.sync-${process.pid}`;
  copyFileSync(file, temporaryPath);
  rmSync(mobilePath, { force: true });
  renameSync(temporaryPath, mobilePath);
  const key = `/assets/crazy/${relativePath}`;
  return `  ${JSON.stringify(key)}: require(${JSON.stringify(`../../assets/images/${mobileRelativePath}`)}),`;
});
const videoEntries = videos.map((file) => {
  const filename = path.basename(file);
  return `  ${JSON.stringify(`/assets/videos/${filename}`)}: require(${JSON.stringify(`../../assets/videos/${filename}`)}),`;
});

const registrySource = `import type { ImageRequireSource } from "react-native";

const imageRegistry: Record<string, number> = {
${imageEntries.join("\n")}
};

const videoRegistry: Record<string, number> = {
${videoEntries.join("\n")}
};

function normalizedPath(src: string) {
  return decodeURIComponent((src.split("?")[0] ?? src).replaceAll("\\\\", "/"));
}

export function imageFor(src: string): ImageRequireSource | undefined {
  const resource = imageRegistry[normalizedPath(src)];
  return resource === undefined ? undefined : (resource as ImageRequireSource);
}

export function videoFor(src: string): number | undefined {
  return videoRegistry[normalizedPath(src)];
}
`;
writeFileSync(path.join(root, "src", "components", "images.ts"), registrySource, "utf8");

console.log(
  `mobile data/assets synced: categories=${seed.categories.length} images=${seed.images.length} videos=${seed.videos.length} testimonials=${seed.testimonials.length} content=${Object.keys(seed.content).length} eventTypes=${seed.eventTypes.length} socialLinks=${seed.socialLinks.length}`,
);
