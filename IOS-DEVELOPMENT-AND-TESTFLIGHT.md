There are two options. **For your own iPhone while developing, choose a development build**; use **TestFlight** when you want to install and share a release-style test version.

### Option 1: Development build for your iPhone

This replaces Expo Go for this app, but still lets you scan a QR code to load your local development server and see code changes.

1. From the project folder, configure EAS and add the development-client package:

   ```powershell
   npx eas-cli login
   npx eas-cli build:configure
   npx expo install expo-dev-client
   ```

2. Give the app a unique iOS bundle identifier in `app.json`. **This project doesn’t currently have one**, and the identifier must be unique to your app.

3. Make sure the mobile content host is live, then add its URL to EAS’s `development` environment:

   ```powershell
   npx eas-cli env:set --name EXPO_PUBLIC_MOBILE_CONTENT_URL --value https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content --environment development --visibility plaintext
   ```

   This URL is public configuration, not a secret. Your local `.env.local` value applies when you run locally; it isn’t automatically used by cloud builds.

4. Start an iPhone development build:

   ```powershell
   npx eas-cli build --platform ios --profile development
   ```

   Follow EAS’s prompts for Apple signing and registering your iPhone if requested. When the build finishes, open its install link on your iPhone.

5. For local development, run:

   ```powershell
   npx expo start
   ```

   Scan that QR code with your iPhone’s camera to open the project in the installed development build.

### Option 2: TestFlight

TestFlight installs a **release-style build**. It’s useful for testing the app as users will receive it, but it doesn’t connect to your local development server for live code changes.

You’ll need a paid Apple Developer account and an app record in App Store Connect. Set the same unique iOS bundle identifier first, then set the content URL in EAS’s `production` environment:

```powershell
npx eas-cli env:set --name EXPO_PUBLIC_MOBILE_CONTENT_URL --value https://ashrafkandil.github.io/CrazyCakesMobile/mobile-content --environment production --visibility plaintext
```

Build and submit to Apple:

```powershell
npx eas-cli build --platform ios --profile production --auto-submit
```

After Apple processes it, add yourself as a tester in App Store Connect and install it using Apple’s TestFlight app.

**Important:** GitHub Pages still needs to be enabled and the content pack deployed before that URL will work. The app’s update code also needs to be included in the build. Expo’s guides: [Development builds](https://docs.expo.dev/develop/development-builds/introduction/) and [TestFlight](https://docs.expo.dev/submit/testflight/).
