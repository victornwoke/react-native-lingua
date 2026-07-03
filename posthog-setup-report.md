<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Lingua language learning app. The integration adds event tracking across all key user flows — onboarding, authentication, language selection, and daily learning engagement. A PostHog client is initialized via `src/lib/posthog.ts` using `expo-constants` to safely load credentials from `app.config.js` extras. The `PostHogProvider` is wrapped in `app/_layout.tsx` alongside `ClerkProvider`, with manual screen tracking for Expo Router. Users are identified on sign-up completion and sign-in completion using their Clerk user ID, with email set as a person property. Error tracking (`captureException`) is wired into auth failure paths.

| Event | Description | File |
|---|---|---|
| `get_started_tapped` | User taps the Get Started button on the onboarding screen to begin their language learning journey. | `app/onboarding.tsx` |
| `sign_up_submitted` | User submits the sign-up form with email and password, triggering email verification. | `src/components/auth/auth-screen.tsx` |
| `sign_up_completed` | User successfully verifies their email code and completes account creation. | `src/components/auth/auth-screen.tsx` |
| `sign_in_submitted` | User submits the sign-in form with their email, triggering a one-time email code. | `src/components/auth/auth-screen.tsx` |
| `sign_in_completed` | User successfully verifies their email code and completes sign-in. | `src/components/auth/auth-screen.tsx` |
| `social_auth_tapped` | User taps a social authentication option (Google, Facebook, or Apple) on the auth screen. | `src/components/auth/auth-screen.tsx` |
| `language_selected` | User selects a target language and taps Continue to begin their learning journey. | `app/language-selection.tsx` |
| `home_dashboard_viewed` | User views the home dashboard — the top of the daily engagement funnel. | `app/(tabs)/home.tsx` |
| `continue_learning_tapped` | User taps the Continue Learning card on the home screen to navigate to the lesson path. | `app/(tabs)/home.tsx` |
| `ai_teacher_started` | User taps the Next Up card to start an AI teacher video lesson from the home screen. | `app/(tabs)/home.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) Dashboard](https://eu.posthog.com/project/214121/dashboard/791996)
- [User Acquisition Funnel](https://eu.posthog.com/project/214121/insights/b6ceNQge) — Get Started → Sign Up Submitted → Sign Up Completed
- [Daily Active Learners](https://eu.posthog.com/project/214121/insights/r4ruB3vA) — Unique daily users on the home dashboard
- [Language Popularity](https://eu.posthog.com/project/214121/insights/aTy1b9do) — Which languages users select most (pie chart by language_name)
- [Learning Engagement](https://eu.posthog.com/project/214121/insights/ARJ44V3S) — Continue Learning taps vs AI Teacher starts over time
- [Auth Method Comparison](https://eu.posthog.com/project/214121/insights/WBJeFbuk) — Email sign-up attempts vs social auth taps

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `identify` is called only on sign-in and sign-up completion. Users who are already signed in (Clerk session restored) should also be identified so that returning sessions are linked to their person profile. Add a `posthog.identify(userId, ...)` call in the Clerk session-restore path (e.g. in a `useEffect` that fires when `useUser()` returns a loaded, signed-in user).

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
