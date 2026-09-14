# Marwa Crazy Cakes — React Native (iOS + Android, phone + tablet)

Expo (SDK 57 / RN 0.86 / TypeScript) clone of the web app (`../CrazyCakes`) with the same UI
concept, the same design tokens, the same Google fonts, and **SQLite** storage seeded from the
web project's live database.

## Run

```bash
npm install
npm start            # Expo dev server — scan QR with Expo Go or press a/i for simulators
npm run android      # requires Android SDK (works on this Windows machine)
npm run ios          # requires macOS + Xcode
```

No config changes needed: `app.json` targets both phones and tablets (`supportsTablet` is
implicit via universal UI; layout adapts at ≥720 dp).

## Data / SQLite

- On first launch, `expo-sqlite` creates `crazy-cakes.db` on-device with the **same schema** as
  the web app (`categories`, `images`, `testimonials`, `content`, `event_types`) and seeds it
  from `src/data/seed.json`.
- Refresh seed data from the web DB any time:
  ```bash
  npm run db:export      # reads ../CrazyCakes/data/crazy-cakes.db -> src/data/seed.json
  ```
  (bump `SCHEMA_VERSION` in `src/db/database.ts` when the web schema changes so devices reseed)
- The repository seam `src/db/database.ts` mirrors the web `src/lib/data.ts`:
  `getGallery(category, page)`, `getTestimonials()`, `getContent()/text(key)`, `getEventTypes()`.

## UI parity

| Web                        | Mobile                                             |
| -------------------------- | -------------------------------------------------- |
| 6 routes                   | Home · About Us · Gallery · Reviews · Pricing · Contact — bottom tab bar (phones), 240 px sidebar (tablets/landscape ≥720 dp) |
| Hero carousel + CTAs       | Paging FlatList, 6.5 s autoplay, dots              |
| DB-driven copy (Home/About)| Same `content` slots (`text('home.hero.title')`)   |
| Gallery chips + pagination + lightbox | Category chips, `‹ Prev / Next ›`, full-screen Modal swipe viewer |
| Reviews (published/sort)   | Testimonial cards, ★ ratings, Google reviews link  |
| Pricing table              | Same layout + Get a quote → Contact                |
| Contact form + event types from DB | Validated form, bottom-sheet event-type picker (from `event_types`), mailto/tel/social `Linking` |
| oklch design tokens        | `src/theme.ts` hex + rgba equivalents              |
| Fonts                      | @expo-google-fonts (Dancing Script, Crimson Text, Inter) |
| Images                     | `assets/images/*` required in `src/components/images.ts` |

## Structure

```
App.tsx                     fonts + SQLite bootstrap, then AppRoot
src/db/database.ts          expo-sqlite repository seam (schema, seed, queries)
src/data/seed.json          exported from the web DB (npm run db:export)
src/navigation/AppRoot.tsx  adaptive phone/tablet shell (state-driven)
src/screens/*.tsx           Home, About, Gallery, Reviews, Pricing, Contact
src/components/ui.tsx       ScriptTitle, Eyebrow, SectionHeading, LocalImage, SocialPill, BrandFooter…
src/components/images.ts    web src path -> require() image registry
scripts/export-seed.mjs     reads the web project's SQLite DB and rewrites seed.json
```

Verified on this machine: `tsc --noEmit` clean and `expo export` bundles successfully for both
`android` and `ios` platforms (JS graph, assets, fonts, images all resolved). Native device
simulator runs need Android Studio (local) / Xcode (Mac).
