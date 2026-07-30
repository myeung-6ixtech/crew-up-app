# CrewUp Mobile (`crew-up-app`)

Expo Router app for CrewUp MVP v1 — verified crew, roster upload, presence, events, chat, and safety — wired to [`crew-up-nhost`](../crew-up-nhost/).

## Stack

- Expo SDK 57 + Expo Router
- `@nhost/nhost-js` (auth + storage) + Apollo Client (Hasura GraphQL + subscriptions)
- Custom backend logic via **Hasura Actions** only: `parseRoster`, `submitReport`
- Event-driven functions (`presence-compute`, `notification-dispatch`) are backend side effects — the app never calls them directly

## Prerequisites

1. Node.js 20+
2. [`crew-up-nhost`](../crew-up-nhost/) running locally (`nhost up`) **or** a dev Nhost Cloud project
3. iOS Simulator / Android emulator (or EAS dev build)

## Setup

```bash
cd crew-up-app
cp .env.example .env
npm install
```

If npm cache permission errors occur:

```bash
NPM_CONFIG_CACHE=./.npm-cache npm install
```

Start Metro:

```bash
npm start
# npm run ios
# npm run android
```

## Environment

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_NHOST_SUBDOMAIN` | Nhost subdomain (`local` for `nhost up`) |
| `EXPO_PUBLIC_NHOST_REGION` | Nhost region (`local` for local dev) |
| `EXPO_PUBLIC_NHOST_*_URL` | Optional overrides for auth/graphql/storage/functions |
| `EXPO_PUBLIC_APP_SCHEME` | Deep link scheme (`crewup`) for password reset |

Local Nhost URLs resolve to `https://local.*.local.nhost.run/v1` when subdomain/region are `local`.

## Backend smoke checklist (M0)

With `crew-up-nhost` up:

1. Hasura exposes Actions `parseRoster`, `submitReport`
2. Storage buckets: `avatars`, `rosters`, `verification-docs`
3. Upload roster → `parseRoster` → insert rosters → `presence` rows appear (via `presence-compute` trigger)

## EAS preview builds (M8)

```bash
npx eas-cli login
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Set Nhost cloud env vars in the EAS project dashboard or `eas.json` profile `env` before cloud builds.

## App structure

```
app/           Expo Router screens (tabs + auth + onboarding + features)
lib/           nhost, apollo, i18n, secure session
services/      Domain + Action wrappers (parseRoster, submitReport)
graphql/       Queries, mutations, subscriptions
contexts/      AppProviders (session + Apollo)
hooks/         useSession, useAuthGuard, useVerificationGate
```

## Push notifications

The app registers an Expo push token locally. Persisting tokens to `profiles.expo_push_token` requires a small backend migration (recommended follow-up) so `notification-dispatch` can send FCM/APNS. In-app `notifications` subscription works without push.

## MVP flow

Sign up → create profile → verification → roster upload/confirm → Home presence → Network/Events → chat → report/block via `submitReport` Action.
