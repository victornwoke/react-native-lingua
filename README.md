# Lingua

Lingua is a Duolingo-inspired AI language learning app built with Expo, React Native, TypeScript, Expo Router, NativeWind, Zustand, Clerk, Stream Video, and a Stream Vision Agent service.

The project is designed as a production-quality teaching app: simple enough to learn from feature by feature, but structured like a real mobile product that can grow from MVP to App Store release.

## What The App Does

- Onboards new learners into a playful mobile-first experience.
- Authenticates users with Clerk.
- Lets users choose a learning language.
- Shows a home dashboard with daily goal progress, a learning plan, streak-style UI, and next lesson entry points.
- Provides hardcoded typed lesson content for Spanish, French, Japanese, and German.
- Stores selected language and active lesson progress locally with Zustand and AsyncStorage.
- Starts AI teacher audio lessons with Stream Video calls.
- Uses server-side Expo API routes to create Stream calls, verify Clerk sessions, and keep Stream secrets out of the mobile app.
- Optionally connects to a separate Stream Vision Agent Python service for live AI teacher sessions.
- Tracks key product events with PostHog.

Some tabs are intentionally still MVP placeholders:

- `AI Teacher` tab: placeholder entry point for future video teacher lessons.
- `Chat` tab: placeholder for chat-based AI tutor practice.
- `Profile` tab: placeholder for account, XP, streak, and settings screens.

## Tech Stack

- Expo SDK 57
- React Native 0.86
- React 19
- TypeScript
- Expo Router
- NativeWind v5 preview with Tailwind CSS v4
- Zustand
- AsyncStorage
- Clerk Expo authentication
- Stream Video React Native SDK
- Stream WebRTC
- Expo API routes for secure server-side operations
- Stream Vision Agent service in `vision-agent/`
- PostHog React Native analytics

## Project Structure

```txt
app/
  _layout.tsx                  Root providers, fonts, analytics, routing
  index.tsx                    Auth/language redirect gate
  onboarding.tsx               Public onboarding route
  sign-in.tsx                  Clerk sign-in UI
  sign-up.tsx                  Clerk sign-up UI
  language-selection.tsx       First signed-in language selection flow
  sso-callback.tsx             OAuth callback route
  (tabs)/
    _layout.tsx                Protected tab navigation
    home.tsx                   Main learner dashboard
    learn.tsx                  Lesson catalog screen
    lesson/[lessonId].tsx      AI audio lesson route
    ai-teacher.tsx             MVP placeholder
    chat.tsx                   MVP placeholder
    profile.tsx                MVP placeholder
  api/
    stream/                    Server-side Stream and agent routes

src/
  components/                  Reusable UI components
  constants/images.ts          Centralized image imports
  hooks/                       App-specific hooks
  lib/                         API, Clerk, Stream, analytics helpers
  store/                       Zustand stores
  theme/                       Colors, fonts, spacing, typography

data/
  languages.ts                 Hardcoded language catalog
  units.ts                     Hardcoded unit catalog
  lessons.ts                   Typed lesson content

types/
  learning.ts                  Shared learning content types

vision-agent/
  agent.py                     Stream Vision Agent service
  README.md                    Agent-specific setup
```

## Prerequisites

Install the following before running the app:

- Node.js LTS
- npm
- Xcode and iOS Simulator for iOS development
- Android Studio and an Android emulator for Android development
- Expo account for EAS builds
- Clerk account
- Stream account
- PostHog project
- Google Gemini API key if running the Vision Agent service
- Apple Developer Program membership before App Store submission

The project includes native modules for Stream/WebRTC. Expo Go is useful for basic UI checks, but AI audio lessons require a development build or a native build.

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Fill in:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_with_your_clerk_development_publishable_key
CLERK_SECRET_KEY=sk_test_replace_with_your_clerk_development_secret_key
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\nreplace_with_your_clerk_jwt_public_key_pem\n-----END PUBLIC KEY-----"
EXPO_PUBLIC_API_URL=http://localhost:8081

POSTHOG_PROJECT_TOKEN=phc_replace_with_your_posthog_project_token
POSTHOG_HOST=https://eu.i.posthog.com

STREAM_API_KEY=replace_with_your_stream_api_key
STREAM_API_SECRET=replace_with_your_stream_api_secret
VISION_AGENT_SHARED_SECRET=replace_with_a_random_shared_agent_secret
GEMINI_API_KEY=replace_with_your_google_gemini_api_key
```

Optional for production AI teacher hosting:

```bash
VISION_AGENT_SERVER_URL=https://your-agent-server.example.com
```

Important security notes:

- `EXPO_PUBLIC_*` values are bundled into the client and are public.
- `CLERK_SECRET_KEY`, `CLERK_JWT_KEY`, `STREAM_API_SECRET`, `VISION_AGENT_SHARED_SECRET`, and `GEMINI_API_KEY` must stay server-side.
- Never commit `.env`, App Store Connect API keys, Google service account JSON files, or private signing material.
- For EAS builds, store secrets in EAS environment variables/secrets instead of hardcoding them.

## Install And Run Locally

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm run start
```

Run on iOS:

```bash
npm run ios
```

Run on Android:

```bash
npm run android
```

Run web, mainly for layout/debugging:

```bash
npm run web
```

Run validation:

```bash
npm run lint
npm run typecheck
```

## Local Development Build

Because the audio lesson flow depends on Stream/WebRTC native modules, use a development build when testing real audio sessions.

Create an iOS development build:

```bash
npx expo run:ios
```

Create an Android development build:

```bash
npx expo run:android
```

You can also use EAS development builds:

```bash
npx eas-cli@latest build -p ios --profile development
npx eas-cli@latest build -p android --profile development
```

## How To Use The App

1. Start the app.
2. Go through onboarding.
3. Create an account or sign in with Clerk.
4. Select a language.
5. Land on the Home tab.
6. Review your daily goal card and today plan.
7. Tap Continue Learning or the next lesson prompt.
8. Choose a lesson from the Learn tab.
9. Start the AI Teacher audio lesson.
10. Use the microphone control to practice speaking.
11. End the lesson to return to the learning flow.

Expected MVP behavior:

- Language selection is persisted locally.
- Active lesson per language is persisted locally.
- Lesson content comes from TypeScript files in `data/`.
- Audio lessons require a signed-in user and a reachable API route.
- If the Vision Agent server is not configured, the app still creates the Stream call and skips the agent gracefully.

## Running The Vision Agent Locally

The Vision Agent service lives in `vision-agent/`.

Install and sync Python dependencies:

```bash
cd vision-agent
uv sync
```

Run the agent:

```bash
uv run agent.py run
```

Run HTTP server mode:

```bash
uv run agent.py serve --host 0.0.0.0 --port 8080
```

For local development, the API route defaults to:

```txt
http://127.0.0.1:8080
```

For production, deploy the agent service and set:

```bash
VISION_AGENT_SERVER_URL=https://your-agent-server.example.com
```

## Service Setup

### Clerk

1. Create a Clerk application.
2. Copy the publishable key into `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Copy the secret key into `CLERK_SECRET_KEY`.
4. Configure OAuth providers if using social sign-in.
5. Configure native redirect URLs for the app scheme:

```txt
duolingoclone://sso-callback
```

6. Add production URLs and schemes before App Store submission.
7. Use live Clerk keys only for production builds.

### Stream

1. Create a Stream app.
2. Copy the API key into `STREAM_API_KEY`.
3. Copy the API secret into `STREAM_API_SECRET`.
4. Keep the secret on the server only.
5. Confirm the app can create video calls from the API routes.
6. Test real audio on physical devices before release.

### PostHog

1. Create a PostHog project.
2. Add `POSTHOG_PROJECT_TOKEN`.
3. Set `POSTHOG_HOST`.
4. Confirm events appear for onboarding, home dashboard views, lesson starts, and lesson abandonment.
5. Review privacy requirements before shipping analytics to production.

## Content Editing

Add or update languages in:

```txt
data/languages.ts
```

Add or update units in:

```txt
data/units.ts
```

Add or update lessons in:

```txt
data/lessons.ts
```

Keep lesson content typed and beginner-friendly. Each production lesson should have:

- Clear title and description.
- Language and unit IDs that exist.
- XP reward and estimated minutes.
- Goals.
- Vocabulary.
- Phrases.
- Practice activities.
- AI teacher prompt data.

## MVP To Production Roadmap

### Phase 1: Current MVP

- Onboarding.
- Clerk authentication.
- Language selection.
- Home dashboard.
- Lesson catalog.
- Local persisted language and active lesson state.
- Stream-backed AI audio lesson route.
- Optional Vision Agent bridge.
- PostHog event capture.

### Phase 2: Complete The Learning Loop

- Mark lessons complete.
- Persist completed lessons.
- Award XP after successful completion.
- Add streak calculations.
- Unlock lessons progressively.
- Show empty, loading, and error states for every learning screen.
- Add profile stats.
- Add reset progress option for testing.

### Phase 3: AI Tutor And Video Teacher

- Build the Chat tab with server-side AI calls.
- Add message history for active sessions.
- Add tutor correction styles by lesson level.
- Build the AI Teacher tab for video-based lessons.
- Add teacher avatars and lesson-specific personas.
- Add robust timeout/retry handling for AI services.

### Phase 4: Production Backend

- Deploy API routes or equivalent backend functions.
- Deploy the Vision Agent service.
- Move every secret to the backend/EAS environment.
- Add server logging.
- Add rate limiting and abuse protection.
- Add user-safe error messages.
- Add monitoring for Stream and agent failures.

### Phase 5: Release Readiness

- Replace placeholder tabs with finished features or hide them.
- Replace placeholder remote images with owned/licensed assets.
- Add privacy policy and support pages.
- Add Terms of Service if required.
- Add account deletion flow or support process.
- Add App Store screenshots.
- Add reviewer demo account.
- Test on multiple physical iPhones and Android devices.
- Test poor network behavior.
- Review accessibility labels and touch targets.

## Production Configuration Checklist

Before building for stores:

- [ ] Confirm app name in `app.json`.
- [ ] Confirm iOS bundle identifier: `com.victornwoke.lingua`.
- [ ] Confirm Android package name: `com.victornwoke.lingua`.
- [ ] Confirm app scheme: `duolingoclone`.
- [ ] Replace test Clerk keys with live Clerk keys.
- [ ] Configure production OAuth redirect URLs.
- [ ] Configure production `EXPO_PUBLIC_API_URL`.
- [ ] Configure production Stream keys.
- [ ] Configure production PostHog token and host.
- [ ] Configure `VISION_AGENT_SERVER_URL` if using the AI agent.
- [ ] Confirm camera and microphone permission copy.
- [ ] Confirm app icon, adaptive icon, favicon, and splash assets.
- [ ] Confirm privacy policy URL.
- [ ] Confirm support URL.
- [ ] Confirm analytics/privacy disclosures.
- [ ] Confirm no secrets are imported into client code.

## EAS Setup

Install and log in:

```bash
npm install --global eas-cli
eas login
```

Initialize EAS if this has not been done:

```bash
npx eas-cli@latest init
```

Create or update `eas.json`:

```json
{
  "cli": {
    "version": ">= 16.0.1",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

Use EAS environment variables for production values:

```bash
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_replace_me --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value https://your-api.example.com --visibility plaintext
npx eas-cli@latest env:create --environment production --name CLERK_SECRET_KEY --value sk_live_replace_me --visibility secret
npx eas-cli@latest env:create --environment production --name STREAM_API_SECRET --value replace_me --visibility secret
```

## iOS App Store Deployment

### 1. Join Apple Developer Program

Create an Apple Developer account and enroll in the Apple Developer Program.

### 2. Create The App Identifier

In Apple Developer or through EAS credentials, make sure the bundle ID exists:

```txt
com.victornwoke.lingua
```

If you change the app name or company, update the bundle identifier before the first production submission.

### 3. Configure App Store Connect

Create a new app in App Store Connect:

- Platform: iOS
- Name: your final app name
- Primary language: your launch language
- Bundle ID: `com.victornwoke.lingua`
- SKU: a unique internal value, for example `lingua-ios`
- User access: full access unless you need limited team permissions

### 4. Configure iOS Credentials

Run:

```bash
npx eas-cli@latest credentials -p ios
```

Let EAS manage:

- Distribution certificate.
- Provisioning profile.
- App Store Connect API key if available.

For CI/CD, prefer an App Store Connect API key instead of Apple ID prompts.

### 5. Set Versioning

The user-facing version is in `app.json`:

```json
{
  "expo": {
    "version": "1.0.0"
  }
}
```

Let EAS auto-increment build numbers:

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 6. Create A Production Build

```bash
npx eas-cli@latest build -p ios --profile production
```

Build and submit in one command:

```bash
npx eas-cli@latest build -p ios --profile production --submit
```

Submit the latest successful build:

```bash
npx eas-cli@latest submit -p ios --latest
```

### 7. Test With TestFlight

Always ship to TestFlight before App Store review.

Recommended flow:

1. Upload the build to App Store Connect.
2. Add internal testers.
3. Test sign-in, language selection, lessons, microphone permission, and AI audio.
4. Add external testers after the internal build is stable.
5. Fix crashes and confusing states before App Review.

### 8. Prepare App Store Metadata

In App Store Connect, complete:

- App name.
- Subtitle.
- Description.
- Keywords.
- Category, likely Education.
- Privacy policy URL.
- Support URL.
- Marketing URL if available.
- Age rating questionnaire.
- App privacy questionnaire.
- Screenshots for required device sizes.
- App Review contact details.
- Demo account credentials if login is required.
- Review notes explaining how to test the AI lesson flow.

Suggested reviewer notes:

```txt
This app teaches beginner language lessons. To test:
1. Sign in with the demo account.
2. Select Spanish.
3. Open Home.
4. Tap Continue Learning.
5. Start a lesson.
6. Allow microphone permission.
7. Use the mic button to practice speaking.

The app uses Stream for real-time audio lessons and Clerk for authentication.
```

### 9. Add Screenshots

Capture real app screens, not mockups:

- Onboarding.
- Sign-in/sign-up.
- Language selection.
- Home dashboard.
- Lesson catalog.
- AI teacher lesson.
- Profile or progress screen once implemented.

Apple allows one to ten screenshots per device size. Use the first screenshots to show the core learning value clearly.

### 10. Submit For Review

In App Store Connect:

1. Select the uploaded build.
2. Complete all missing metadata.
3. Answer export compliance.
4. Add demo credentials.
5. Add reviewer notes.
6. Submit for review.

Use manual release or phased release for the first production launch so you can control rollout timing.

## Android Play Store Deployment

Even if iOS is the first launch target, keep Android ready.

1. Create a Google Play Developer account.
2. Create the app in Play Console.
3. Confirm package name:

```txt
com.victornwoke.lingua
```

4. Complete store listing, content rating, privacy policy, and data safety.
5. Create a Google service account.
6. Download the service account JSON.
7. Add it to `.gitignore`.
8. Configure `eas.json` submit settings.
9. Build an Android App Bundle:

```bash
npx eas-cli@latest build -p android --profile production
```

10. Submit to the internal track first:

```bash
npx eas-cli@latest submit -p android --latest
```

11. Promote from internal testing to closed, open, then production when stable.

## Over-The-Air Updates

EAS Update is not configured in this repo yet. If you add it later, use over-the-air updates only for JavaScript and asset changes that do not require native changes.

Good OTA candidates:

- Copy changes.
- Lesson content updates.
- UI tweaks.
- Non-native bug fixes.

Requires a new store build:

- New native modules.
- App icon/splash changes.
- Permission changes.
- Bundle identifier/package changes.
- Native config plugin changes.
- WebRTC/Stream native dependency changes.

## Go-Live Checklist

Product:

- [ ] All launch tabs are complete or intentionally hidden.
- [ ] No placeholder text remains in production screens.
- [ ] Lessons have been reviewed by a language speaker.
- [ ] AI teacher prompts are safe and age-appropriate.
- [ ] User-facing errors are friendly and actionable.

Engineering:

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] Production build succeeds.
- [ ] App works on physical iPhone.
- [ ] App works on physical Android device if launching Android.
- [ ] Clerk live auth works.
- [ ] Stream call creation works.
- [ ] Vision Agent connects if enabled.
- [ ] Analytics events arrive in PostHog.
- [ ] No secrets are present in the client bundle.

Store:

- [ ] App Store Connect app record exists.
- [ ] Privacy policy URL is live.
- [ ] Support URL is live.
- [ ] App screenshots are uploaded.
- [ ] App Review demo account works.
- [ ] App privacy answers match actual data collection.
- [ ] Age rating is complete.
- [ ] Export compliance is answered.
- [ ] Release notes are written.

Operations:

- [ ] Error monitoring is configured.
- [ ] Analytics dashboard is configured.
- [ ] Support inbox is monitored.
- [ ] Rollback plan is documented.
- [ ] TestFlight feedback has been reviewed.
- [ ] First release uses manual or phased rollout.

## Troubleshooting

### `Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file.`

The root layout requires Clerk at startup. Add the key to `.env`, then restart the Expo server.

### Clerk sign-in works but API routes return 401

Check:

- `CLERK_SECRET_KEY` is set.
- `CLERK_JWT_KEY` is set and uses the correct public key format.
- The user session is active.
- The request includes a Bearer token.
- You restarted the dev server after changing `.env`.

### Audio lessons fail in Expo Go

Use a development build. Stream/WebRTC native modules are not available in Expo Go.

```bash
npx expo run:ios
npx expo run:android
```

### `Could not start the Stream audio lesson.`

Check:

- `STREAM_API_KEY` is set.
- `STREAM_API_SECRET` is set.
- The selected lesson exists.
- The selected language matches the lesson language.
- The API route is reachable from the device.
- For a physical device, `EXPO_PUBLIC_API_URL` points to a reachable LAN or hosted URL, not an unreachable localhost.

### Physical device cannot reach local API routes

Set `EXPO_PUBLIC_API_URL` to your machine LAN address:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.25:8081
```

Then restart Expo.

### Vision Agent does not join the call

Check:

- The app still works without the agent because the route skips gracefully when the agent is not configured.
- `vision-agent` server is running.
- `STREAM_API_KEY`, `STREAM_API_SECRET`, `VISION_AGENT_SHARED_SECRET`, and `GEMINI_API_KEY` are available to the agent.
- `VISION_AGENT_SERVER_URL` points to the deployed agent in production.
- The app server can reach the agent URL.

### Microphone permission does not appear or audio does not work

Check:

- You are using a development/native build.
- The app has microphone permission.
- The iOS and Android permission strings are present in `app.json`.
- You are testing on a real device when possible.
- The simulator/emulator microphone is configured correctly.

### App Store upload says bundle version must be higher

Enable EAS auto-increment in `eas.json`:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### App Store Connect cannot find the app

Create the app record in App Store Connect first and make sure the bundle ID matches `app.json`.

### Missing export compliance

If the app does not use non-exempt encryption, add the iOS config before release:

```json
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

Confirm this is accurate for the final production app before submitting.

### EAS build cannot access environment variables

Local `.env` values are not automatically production secrets. Add production values to EAS:

```bash
npx eas-cli@latest env:list
npx eas-cli@latest env:create --environment production --name VARIABLE_NAME --value value --visibility secret
```

### Native build fails after dependency changes

Try:

```bash
npx expo prebuild --clean
npm run ios
```

Only do this when you intentionally want to regenerate native project files.

### TypeScript path imports fail

The app uses `@/*` for `src/*` and `@/assets/*` for `assets/*`. Check `tsconfig.json` if imports fail.

## Useful Commands

```bash
npm install
npm run start
npm run ios
npm run android
npm run web
npm run lint
npm run typecheck
npx eas-cli@latest init
npx eas-cli@latest credentials -p ios
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest submit -p ios --latest
npx eas-cli@latest submit -p android --latest
```

## Official References

- Expo docs: https://docs.expo.dev/
- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo environment variables: https://docs.expo.dev/guides/environment-variables/
- Expo EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- Apple Developer Program: https://developer.apple.com/programs/
- App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Console: https://play.google.com/console/
- Clerk Expo docs: https://clerk.com/docs/references/expo/overview
- Stream Video React Native docs: https://getstream.io/video/docs/reactnative/
- PostHog React Native docs: https://posthog.com/docs/libraries/react-native

## License

This project currently includes an MIT license in `LICENSE`.
