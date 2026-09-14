import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
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
  testimonials: db
    .prepare(
      "SELECT id, author, initials, review_date AS date, quote, rating FROM testimonials WHERE published = 1 ORDER BY sort, id",
    )
    .all(),
  content: Object.fromEntries(
    db.prepare("SELECT key, value FROM content ORDER BY key").all().map((row) => [row.key, row.value]),
  ),
  eventTypes: db.prepare("SELECT label FROM event_types ORDER BY sort, id").all().map((row) => row.label),
};

db.close();

const target = path.join(root, "src", "data", "seed.json");
writeFileSync(target, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
console.log(
  `seed.json written: categories=${seed.categories.length} images=${seed.images.length} testimonials=${seed.testimonials.length} content=${Object.keys(seed.content).length} eventTypes=${seed.eventTypes.length}`,
);
