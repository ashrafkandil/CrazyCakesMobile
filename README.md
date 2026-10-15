# Marwa Crazy Cakes — React Native (iOS + Android, phone + tablet)

Expo (SDK 57 / RN 0.86 / TypeScript) mobile app with its own content database and media pack.
The first mobile database is copied from the website database, then maintained and published
independently of the website.

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

## Mobile content / SQLite

- The mobile project owns `data/crazy-cakes.db` and its copies of media under `assets/`. The database
  was initially copied from `../CrazyCakesAI/data/crazy-cakes.db`; after that one-time import, mobile
  content and media can be changed and published independently of the website.
- The import leaves the website database untouched and removes only copied image/video rows whose
  referenced file is missing from this mobile project's media folders.
- The SQLite file is bundled as a first-launch/offline fallback. At startup, and whenever the app
  returns to the foreground, it checks `manifest.json` at `EXPO_PUBLIC_MOBILE_CONTENT_URL` without
  blocking the local app from opening. If the
  database or media pack changes, the app downloads the DB, verifies its size, SHA-256, SQLite
  integrity, and required tables, then switches to it only after validation. The pack version is
  also used as a media cache key so replaced images/videos are fetched again. An unavailable host
  or invalid download leaves the last valid local database in use.
- Images and videos are published as separate files, not SQLite BLOBs. The app loads them from the
  same content host and falls back to bundled media when available. Expo Image also uses its disk
  cache. Use HTTPS and configure the host to revalidate `manifest.json` rather than caching it
  indefinitely.

### Import, edit, and publish

1. The one-time source copy is already in `data/crazy-cakes.db`. To initialize a fresh checkout from
   the website again, run `npm run content:import-db`; it refuses to overwrite an existing mobile
   database.
2. Edit `data/crazy-cakes.db` with a SQLite tool. Keep media referenced by `images.src` and
   `videos.src` in this project's `assets/images/` and `assets/videos/` folders.
3. Build the deployable pack:
   ```bash
   npm run content:build
   ```
   This writes `dist-content/manifest.json`, a validated database copy, and the mobile-owned media
   files (including the home-screen artwork).
4. The `Publish mobile content` GitHub Actions workflow builds and deploys `dist-content/` to
   `https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content/` on pushes to `master` (or
   manually via Actions → Publish mobile content → Run workflow). In repository Settings → Pages,
   choose GitHub Actions as the build and deployment source. The published database and media are
   public; only put public app content in this pack.
5. `.env.local` is configured with
   `EXPO_PUBLIC_MOBILE_CONTENT_URL=https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content`.
   Because Expo embeds `EXPO_PUBLIC_` values in the app, installed apps built before this URL was
   configured need one new app build. After that, content and media updates do not need new builds.

The data access functions in `src/db/database.ts` (`getGallery`, `getTestimonials`, `getContent` /
`text`, `getEventTypes`, and `getSocialLinks`) read from the current local SQLite database, whether
it is the bundled fallback or a validated downloaded update.

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
| Images/videos + watermark  | Mobile-owned media pack, remote updates with bundled fallback, repeated logo watermark |
| Talking AI avatar ("Sprinkles") | Same SVG baker, mood states, voice (speak + record), language toggle, quick chips, and safe actions |

## AI assistant ("Sprinkles")

A talking avatar appears in the corner right after the splash screen (it flies in from the centre)
and opens a chat panel. It is a port of the website's `src/app/assistant/*` widget onto React Native,
with the same handful of files:

| Web                                          | Mobile                                             |
| -------------------------------------------- | -------------------------------------------------- |
| `src/app/assistant/avatar-face.tsx`          | `src/assistant/AvatarFace.tsx` (react-native-svg)  |
| `src/app/assistant/avatar-widget.tsx`        | `src/assistant/AvatarAssistant.tsx`                |
| `src/app/assistant/use-voice-recorder.ts`    | `src/assistant/voiceRecorder.ts` (expo-audio)      |
| `src/app/api/assistant/route.ts`             | `src/assistant/client.ts` (Gemini, from the device)|
| `src/lib/assistant/knowledge.ts`             | `src/assistant/knowledge.ts` (device SQLite)       |
| `src/lib/assistant/shared.ts`                | `src/assistant/shared.ts`                          |
| `sessionStorage` quote draft                 | `src/assistant/quoteDraft.ts` (in-memory store)    |

What it can do (same as the site):

- Answer from the site's own content - starting prices, contact info, gallery categories, reviews -
  read live from the on-device SQLite replica, so it always matches what the screens show.
- **Talk:** tap the mic, speak, and tap again (or pause) to send. The clip is sent to Gemini, which
  transcribes and answers in one call. **Listen:** the reply is spoken with the device's voices
  (`expo-speech`), with a mute toggle and an English/Arabic switch.
- **Act:** open a screen ("show me wedding cakes" jumps to Gallery → Wedding), or fill in the quote
  form. The assistant writes a draft that ContactScreen reads and subscribes to, so the form is
  pre-filled the moment it opens and cleared once sent.

### Configuration (required)

The assistant needs a Gemini key. Unlike the website, an app has no server, so the key is inlined
into the bundle from a `.env` file:

```bash
cp .env.example .env.local
# edit .env.local -> EXPO_PUBLIC_GEMINI_API_KEY=your-key
```

Restart the Expo dev server (or reload the app) after changing `.env.local`.

> **Security note:** `EXPO_PUBLIC_` variables are bundled in plain text and can be extracted from a
> shipped app. Use a key restricted to the *Generative Language API*, set per-key quotas, and rotate
> it if it leaks. For a production app, proxy Gemini through a server instead (as the website does).

Optional: `EXPO_PUBLIC_GEMINI_MODEL` pins a model, `EXPO_PUBLIC_GEMINI_API_BASE_URL` points at a
proxy. Either way the client tries a list of Flash/Lite models in order and remembers the one that
answers. A `.env.example` documents the names; `.env.local` is gitignored.

## Structure

```
App.tsx                     fonts + SQLite bootstrap, then AppRoot
data/crazy-cakes.db         mobile-owned SQLite source and bundled first-launch database
src/db/database.ts          expo-sqlite repository, content-pack updater, and queries
src/data/seed.json          legacy snapshot (not read by the app; edit the SQLite database)
src/navigation/AppRoot.tsx  adaptive phone/tablet shell (state-driven) + mounts the assistant
src/screens/*.tsx           Home, About, Gallery, Reviews, Pricing, Contact
src/assistant/*             "Sprinkles": AvatarFace, AvatarAssistant, client (Gemini), speech,
                            voiceRecorder, knowledge (from SQLite), shared, quoteDraft
src/components/ui.tsx       ScriptTitle, Eyebrow, SectionHeading, LocalImage, SocialPill, BrandFooter…
src/components/images.ts    bundled offline fallback registry for images and videos
scripts/import-source-db.mjs one-time website DB copy into this mobile repo
scripts/seed-content.mjs    builds the separately published database/media content pack
```

Verified on this machine: `tsc --noEmit` clean and `expo export` bundles successfully for both
`android` and `ios` platforms (JS graph, assets, fonts, images all resolved). Native device
simulator runs need Android Studio (local) / Xcode (Mac).
