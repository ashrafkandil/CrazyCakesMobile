# Marwa Crazy Cakes — React Native (iOS + Android, phone + tablet)

Expo (SDK 57 / RN 0.86 / TypeScript) clone of the web app (`../CrazyCakes`) with the same UI
concept, the same design tokens, the same Google fonts, and **SQLite** storage seeded from the
web project's live database.

## Run

```bash
npm install
npm start            # Expo dev server — scan QR *inside Expo Go*, or press a for the Android emulator
npm run start:tunnel # same, but reachable from any network (ngrok)
npm run android      # boots an AVD and installs the matching Expo Go automatically
npm run ios          # requires macOS + Xcode
```

### If the QR code "does not scan"

1. **Scan with Expo Go, not the phone camera.** The code encodes an `exp://…` URL, which the system
   camera app does not understand. Open Expo Go and use its "Scan QR code" button.
2. **Expo Go must match this project's SDK (57).** Each Expo Go build carries exactly one SDK, and
   the iPhone App Store build stops at SDK 54 — SDK 55+ is not published there. You will otherwise
   see "Project is incompatible with this version of Expo Go".
   - Android phone/emulator: install the SDK 57 build from <https://expo.dev/go> (or just run
     `npm run android` — the CLI downloads `Expo-Go-57.x.apk` for you).
   - iPhone: use the iOS Simulator, a development build, or `eas go` (TestFlight) — see
     <https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/>.
3. **Phone and PC must be on the same routed network** and the access point must allow
   client-to-client traffic (guest/corporate Wi-Fi usually does not). This machine advertises its
   Wi-Fi address (`lan-network` correctly skips the VMware/Hyper-V adapters). If that fails, use
   `npm run start:tunnel` and scan again, or press `a` for an emulator.
4. Windows Defender must allow inbound connections for `node.exe` (already present on this machine).

No config changes needed: `app.json` targets both phones and tablets (layout adapts at ≥720 dp).

## Data / SQLite

- On first launch, `expo-sqlite` creates `crazy-cakes.db` on-device with the website schema
  (`categories`, `images`, `videos`, `testimonials`, `content`, `event_types`, `social_links`) and
  seeds it from `src/data/seed.json`.
- Refresh seed data from the web DB any time:
  ```bash
  npm run db:export      # syncs the live DB, site images/videos, and native asset registries
  ```
  The export replaces `assets/images` and `assets/videos` with the current website media, regenerates
  exact-path native `require()` maps, and lowercases copied image extensions for Metro while keeping
  the original web paths in SQLite. Bump `SCHEMA_VERSION` in `src/db/database.ts` when the website
  schema changes so installed devices reseed.
- The repository seam `src/db/database.ts` mirrors the web `src/lib/data.ts`:
  `getGallery(category, page, shuffleSeed)`, `getTestimonials()`, `getContent()/text(key)`,
  `getEventTypes()`, and `getSocialLinks()`.

## UI parity

| Web                        | Mobile                                             |
| -------------------------- | -------------------------------------------------- |
| 6 routes                   | Home · About Us · Gallery · Reviews · Pricing · Contact — bottom tab bar (phones), 240 px sidebar (tablets/landscape ≥720 dp) |
| Hero carousel + CTAs       | Paging FlatList, 6.5 s autoplay, dots              |
| DB-driven copy (Home/About)| Same `content` slots (`text('home.hero.title')`)   |
| Gallery chips + pagination + lightbox + videos | Category chips, stable random All ordering, image/video tiles, full-screen image/video players |
| Reviews (published/sort)   | Testimonial cards, ★ ratings, Google reviews link  |
| Pricing table              | Same layout + Get a quote → Contact                |
| Contact form + event types from DB | Validated form, bottom-sheet event-type picker (from `event_types`), mailto/tel/social `Linking` |
| oklch design tokens        | `src/theme.ts` hex + rgba equivalents              |
| Fonts                      | @expo-google-fonts (Dancing Script, Crimson Text, Inter) |
| Images/videos + watermark  | Current website assets, generated native require maps, repeated logo watermark behind screens and gallery tiles |

## Structure

```
App.tsx                     fonts + SQLite bootstrap, then AppRoot
src/db/database.ts          expo-sqlite repository seam (schema, seed, queries)
src/data/seed.json          exported from the web DB (npm run db:export)
src/navigation/AppRoot.tsx  adaptive phone/tablet shell (state-driven)
src/screens/*.tsx           Home, About, Gallery, Reviews, Pricing, Contact
src/components/ui.tsx       ScriptTitle, Eyebrow, SectionHeading, LocalImage, SocialPill, BrandFooter…
src/components/images.ts    exact web src path -> generated require() image/video registries
scripts/export-seed.mjs     syncs web SQLite data and image/video files into the mobile project
```

Verified on this machine: `tsc --noEmit` clean and `expo export` bundles successfully for both
`android` and `ios` platforms (JS graph, assets, fonts, images all resolved). Native device
simulator runs need Android Studio (local) / Xcode (Mac).
