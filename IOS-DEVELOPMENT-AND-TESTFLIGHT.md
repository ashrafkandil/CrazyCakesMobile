# iOS development and TestFlight

This repo is configured for Expo SDK 57 and includes a remote SQLite/media content pack. The main
release requirement for iPhone builds is a unique iOS bundle identifier and a valid public content URL.

There are two main options:
- **Development build** for your own iPhone while you are actively developing
- **TestFlight** for a release-style build to share with testers

## Prerequisites

- a Mac with Xcode if you want to run the iOS simulator locally
- an Apple Developer account for device builds or TestFlight
- an EAS account and app setup (`npx eas-cli login`)
- a live `EXPO_PUBLIC_MOBILE_CONTENT_URL` pointing at the published content pack

## Option 1: development build for your iPhone

This replaces Expo Go for this app and still allows you to scan a QR code from your local dev server.

1. From the project folder, configure EAS and add the development-client package:

   ```powershell
   npx eas-cli login
   npx eas-cli build:configure
   npx expo install expo-dev-client
   ```

2. Give the app a unique iOS bundle identifier in `app.json`. This repo does not currently include one,
   and it must be unique to your app. Example:

   ```json
   "ios": {
     "bundleIdentifier": "com.yourcompany.marwacrazycakes",
     "supportsTablet": true
   }
   ```

3. Make sure the content host is live, then set the URL in EAS’s `development` environment:

   ```powershell
   npx eas-cli env:set --name EXPO_PUBLIC_MOBILE_CONTENT_URL --value https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content --environment development --visibility plaintext
   ```

   This URL is public configuration, not a secret. Your local `.env.local` value applies when you run
   locally, but it is not automatically used by cloud builds.

4. Start a development build for iOS:

   ```powershell
   npx eas-cli build --platform ios --profile development
   ```

   Follow EAS prompts for signing and, if needed, register your iPhone. When the build finishes, open
   the install link on the device.

5. For local development, run:

   ```powershell
   npx expo start
   ```

   Scan the resulting QR code with your iPhone’s camera or the installed development build's QR flow
   to open the app on your device.

## Option 2: TestFlight

TestFlight installs a release-style build. It is useful for testing the app as end users will receive
it, but it does not connect to a local development server for live code changes.

You’ll need a paid Apple Developer account and an app record in App Store Connect. Set the same unique
iOS bundle identifier first, then set the content URL in EAS’s `production` environment:

```powershell
npx eas-cli env:set --name EXPO_PUBLIC_MOBILE_CONTENT_URL --value https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content --environment production --visibility plaintext
```

Build and submit to Apple:

```powershell
npx eas-cli build --platform ios --profile production --auto-submit
```

After Apple processes the build, add yourself as a tester in App Store Connect and install it through
TestFlight.

## Important notes

- GitHub Pages must remain enabled and the mobile content pack must be published before the remote URL
  resolves successfully.
- The app’s remote content update logic must be included in the build; otherwise it will continue to use
  the bundled database only.
- Expo’s official docs are the source of truth for EAS and TestFlight workflows:
  https://docs.expo.dev/develop/development-builds/introduction/
  https://docs.expo.dev/submit/testflight/

## Current repo status

The repo currently assumes the public content host is:
`https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content`

This is the URL used by the app’s runtime content update checks and should stay in sync with the actual
GitHub Pages deployment.
