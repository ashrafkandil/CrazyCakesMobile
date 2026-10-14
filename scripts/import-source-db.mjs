#!/usr/bin/env node

import { DatabaseSync } from "node:sqlite";
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "..", "CrazyCakesAI", "data", "crazy-cakes.db");
const destination = path.join(root, "data", "crazy-cakes.db");

if (!existsSync(source)) {
  throw new Error(`Source SQLite database not found: ${source}`);
}
if (existsSync(destination)) {
  throw new Error(
    `Mobile database already exists at ${destination}; refusing to overwrite the mobile-owned copy.`,
  );
}

const db = new DatabaseSync(source, { readOnly: true });
try {
  const integrity = db.prepare("PRAGMA integrity_check").get();
  if (integrity?.integrity_check !== "ok") {
    throw new Error(`Source database failed integrity_check: ${integrity?.integrity_check ?? "no result"}`);
  }
  const tables = new Set(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
  );
  for (const table of [
    "categories",
    "images",
    "videos",
    "testimonials",
    "content",
    "event_types",
    "social_links",
  ]) {
    if (!tables.has(table)) throw new Error(`Source database is missing required table "${table}".`);
  }
} finally {
  db.close();
}

mkdirSync(path.dirname(destination), { recursive: true });
const temporaryDestination = `${destination}.importing-${process.pid}`;
if (existsSync(temporaryDestination)) {
  throw new Error(`A previous import staging file already exists: ${temporaryDestination}`);
}

const missingMedia = [];
try {
  copyFileSync(source, temporaryDestination);
  const mobileDb = new DatabaseSync(temporaryDestination);
  function referencedAsset(src) {
    const pathValue = decodeURIComponent(String(src).split("?")[0]).replaceAll("\\", "/");
    const relativePath = (prefix) => {
      const relative = pathValue.slice(prefix.length);
      const extensionIndex = relative.lastIndexOf(".");
      return extensionIndex < 0
        ? relative
        : `${relative.slice(0, extensionIndex)}${relative.slice(extensionIndex).toLowerCase()}`;
    };
    if (pathValue.startsWith("/assets/crazy/")) {
      return path.join(root, "assets", "images", relativePath("/assets/crazy/"));
    }
    if (pathValue.startsWith("/assets/videos/")) {
      return path.join(root, "assets", "videos", relativePath("/assets/videos/"));
    }
    throw new Error(`Unsupported media path in copied database: ${src}`);
  }

  try {
    mobileDb.exec("BEGIN IMMEDIATE");
    for (const table of ["images", "videos"]) {
      const rows = mobileDb.prepare(`SELECT id, src FROM ${table}`).all();
      for (const row of rows) {
        if (!existsSync(referencedAsset(row.src))) {
          missingMedia.push({ table, id: row.id, src: row.src });
          mobileDb.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
        }
      }
    }
    const integrity = mobileDb.prepare("PRAGMA integrity_check").get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error(
        `Copied mobile database failed integrity_check: ${integrity?.integrity_check ?? "no result"}`,
      );
    }
    mobileDb.exec("COMMIT");
  } catch (error) {
    mobileDb.exec("ROLLBACK");
    throw error;
  } finally {
    mobileDb.close();
  }

  renameSync(temporaryDestination, destination);
} catch (error) {
  rmSync(temporaryDestination, { force: true });
  throw error;
}

if (missingMedia.length > 0) {
  console.warn(
    `Removed ${missingMedia.length} media reference(s) with no matching file from the mobile copy only:\n` +
      missingMedia.map((entry) => `  ${entry.table} id=${entry.id}: ${entry.src}`).join("\n"),
  );
}
console.log(`Copied source database into the mobile project:\n  ${source}\n  ${destination}`);
