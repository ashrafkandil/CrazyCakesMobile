# Marwa Crazy Cakes Mobile

Expo SDK 57 / React Native 0.86 / TypeScript app for iOS and Android, designed to match the
Marwa Crazy Cakes website while running independently with its own SQLite content and media pack.

This repo now includes:
- a bundled SQLite database plus remote content-pack updates
- a mobile-optimized gallery, pricing, reviews, and contact experience
- a talking AI assistant named “Sprinkles” that answers from on-device content and can speak, listen,
  and prefill the quote form
- a GitHub Pages content host for remote database/media updates without shipping a new app build

## Quick start

```bash
npm install
cp .env.example .env.local
npm start
```

Then:
- scan the QR with Expo Go on a phone, or
- press `a` for Android Emulator, or
- press `i` for iOS Simulator (on macOS with Xcode)

### Useful commands

```bash
npm run start:tunnel # run through ngrok / reachable from mobile devices on other networks
npm run android      # launch Android emulator or device
npm run ios          # launch iOS simulator / device flow
npm run web          # Expo web preview
npm run content:import-db # one-time copy of the source database into this repo
npm run content:build     # generate the deployable content pack under dist-content/
```

### QR / Expo Go notes

1. Scan the QR with Expo Go, not the phone camera. The code is an `exp://` URL and the camera app
   will not open it.
2. Expo Go must match the project SDK. This app targets Expo SDK 57. If you see “Project is
   incompatible with this version of Expo Go”, install the matching SDK 57 build from Expo Go.
3. Your device and machine should be on the same routed network, or use `npm run start:tunnel`.
4. Windows Defender may need to allow inbound traffic for `node.exe`.

## Environment variables

The app reads the following values from `.env.local`:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
EXPO_PUBLIC_MOBILE_CONTENT_URL=https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content
EXPO_PUBLIC_GEMINI_MODEL=gemini-flash-lite-latest
EXPO_PUBLIC_GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
```

- `EXPO_PUBLIC_GEMINI_API_KEY` is required for the assistant to talk to Gemini.
- `EXPO_PUBLIC_MOBILE_CONTENT_URL` points to the hosted mobile-content pack. The app falls back to the
  bundled local database when the host is unavailable.
- `EXPO_PUBLIC_GEMINI_MODEL` and `EXPO_PUBLIC_GEMINI_API_BASE_URL` are optional overrides when you
  want to pin a specific model or forward requests through a proxy.

The repository includes `.env.example` as the template; `.env.local` is gitignored.

> Security note: `EXPO_PUBLIC_` values are embedded in the app bundle and can be viewed by anyone who
> extracts the app. Use a restricted API key and rotate it if it ever leaks.

## Mobile content / SQLite

The mobile project owns `data/crazy-cakes.db` and the local media assets under `assets/`.

- The database was copied once from the website and is then maintained independently.
- The app ships with a bundled SQLite database as the first-launch/offline fallback.
- At startup and whenever the app returns to the foreground, it checks the remote `manifest.json`
  at `EXPO_PUBLIC_MOBILE_CONTENT_URL` without blocking the local app from opening.
- If the remote pack is newer or valid, the app downloads the database and media, verifies the file
  size, SHA-256, SQLite integrity, and required tables, then switches to the new copy only after
  validation.
- If the host is unavailable or the pack is invalid, the app keeps using the last known-good local
  database and bundled media.

### Import, edit, and publish a content pack

1. The initial source copy is already present in `data/crazy-cakes.db`.
   To recreate it from the website again, run:
   ```bash
   npm run content:import-db
   ```
2. Edit `data/crazy-cakes.db` using a SQLite client, keeping any referenced image/video files in
   `assets/images/` and `assets/videos/`.
3. Generate the deployable pack:
   ```bash
   npm run content:build
   ```
   This writes `dist-content/manifest.json`, a validated database copy, and the published media files.
4. The `Publish mobile content` GitHub Actions workflow deploys `dist-content/` to
   `https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content/` when pushed to `master` or when
   run manually from the Actions tab.
5. Set GitHub Pages to use GitHub Actions as the build and deployment source in repository settings.
   The published content is public; only include public-facing content in the pack.

The database access layer in `src/db/database.ts` reads from the active local SQLite database,
regardless of whether it is the bundled fallback or a validated downloaded update.

## Product features

| Web | Mobile |
| --- | --- |
| 6 routes | Home · About Us · Gallery · Reviews · Pricing · Contact |
| Hero carousel + CTAs | Paging FlatList, 6.5s autoplay, active dots |
| DB-backed marketing copy | Same content slots and data-driven sections |
| Gallery + lightbox + video player | Category chips, stable random All ordering, image/video tiles, full-screen player |
| Reviews with publish/sort logic | Testimonial cards, ratings, Google reviews link |
| Pricing table | Matching layout + “Get a quote” → Contact |
| Contact form + event types | Validated form + event-type picker + tel/mailto/social links |
| Design tokens | `src/theme.ts` and responsive mobile styling |
| Fonts | @expo-google-fonts (Dancing Script, Crimson Text, Inter) |
| Watermarked media | Mobile-owned media pack and bundled fallback |
| Talking AI avatar | “Sprinkles” voice assistant with mic, speak/listen, and action triggers |

## AI assistant (“Sprinkles”)

The assistant appears in the corner after the splash screen and opens a chat panel. It is a React
Native port of the website assistant and reads from the same local SQLite content source on the device.

It can:
- answer questions about pricing, contact details, gallery categories, and reviews
- listen for spoken input and transcribe it through Gemini
- speak replies back to the user with `expo-speech`
- switch between English and Arabic
- open relevant screens, such as the Wedding gallery, or draft a contact inquiry for the quote form

### Files of interest

```text
App.tsx                     bootstrap + app shell
src/navigation/AppRoot.tsx adaptive phone/tablet shell + assistant mount
src/db/database.ts          SQLite repository, updater, and query layer
src/assistant/*             AvatarFace, AvatarAssistant, client, speech, recorder, knowledge, shared, quoteDraft
src/screens/*.tsx           Home, About, Gallery, Reviews, Pricing, Contact
scripts/import-source-db.mjs one-time website DB copy
scripts/seed-content.mjs    content-pack builder
```

## Structure

```text
App.tsx                     fonts + SQLite bootstrap, then AppRoot
app.json                    Expo app metadata and native plugin config
data/crazy-cakes.db         mobile-owned SQLite source and bundled first-launch database
dist-content/               generated public content pack
assets/                     bundled images and videos
src/db/database.ts          expo-sqlite repository, content-pack updater, and queries
src/data/seed.json          legacy snapshot (not used by the app at runtime)
src/navigation/AppRoot.tsx  adaptive phone/tablet shell + mounts the assistant
src/screens/*.tsx           Home, About, Gallery, Reviews, Pricing, Contact
src/assistant/*             “Sprinkles”: avatar, client (Gemini), speech, recorder, knowledge, shared,
                            quoteDraft
src/components/ui.tsx       shared UI components
src/components/images.ts    bundled offline fallback registry for image/video media
scripts/import-source-db.mjs one-time website DB copy into this mobile repo
scripts/seed-content.mjs    builds the separately published database/media content pack
```

## Deployment and release notes

- The app is configured for Expo SDK 57 and React Native 0.86.3.
- Content updates do not require a new app release after the initial install, as long as the content
  host URL remains valid.
- For iPhone development and TestFlight distribution, follow the steps in
  `IOS-DEVELOPMENT-AND-TESTFLIGHT.md`.

## Validation

This repo has been validated locally with:
- `tsc --noEmit` (clean)
- successful Expo export for Android and iOS build graph resolution

Native simulator runs require Android Studio or Xcode on the appropriate host machine.
