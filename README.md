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
# npm run ios      — expo start --ios
# npm run android  — expo start --android
```

### iOS Simulator tips

- **`npm run ios`** is plain `expo start --ios`. On first run (or after an Expo SDK bump) Expo CLI **installs/updates Expo Go** in the simulator to match SDK 57 — this can take a minute, and is required.
- If the simulator ever shows a stale bundle or a transform error after installing new native deps, clear the Metro cache: `npx expo start --ios --clear`.
- **"No apps connected"** just means Metro tried to reload before Expo Go finished connecting — wait for the app to appear, then reload with **`Cmd + R`** in the simulator (not `r` in Metro).
- Physical device on the same Wi‑Fi: `npx expo start --lan` and scan the QR code in Expo Go.
- There is intentionally **no `babel.config.js` or `metro.config.js`** in this project — Expo's default Metro/Babel config already auto-detects and wires up `react-native-reanimated`/`react-native-worklets` via `babel-preset-expo`. Adding a custom `babel.config.js` that also lists `react-native-reanimated/plugin` double-applies the worklets Babel transform and breaks the bundle at runtime, so don't reintroduce one unless you have a specific reason and remove the redundant plugin entry.

## Environment

Default `.env` targets **Nhost Cloud** (`crewup-dev` / `ap-southeast-1`) so Google OAuth and API calls hit the deployed backend, not `nhost up` local URLs.

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_NHOST_SUBDOMAIN` | Nhost subdomain (`crewup-dev` for cloud; `local` for `nhost up`) |
| `EXPO_PUBLIC_NHOST_REGION` | Nhost region (`ap-southeast-1` for cloud; `local` for local dev) |
| `EXPO_PUBLIC_NHOST_*_URL` | Optional overrides for auth/graphql/storage/functions |
| `EXPO_PUBLIC_APP_SCHEME` | Deep link scheme (`crewup`) for OAuth return + password reset |

Cloud auth URL (Google OAuth): `https://crewup-dev.auth.ap-southeast-1.nhost.run/v1`

Local Nhost URLs resolve to `https://local.*.local.nhost.run/v1` when subdomain/region are `local`.

**Google OAuth:** Client ID/secret live in Nhost Cloud secrets only — not in this app. After changing `.env`, restart Metro (`npm start`).

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

## Design system

Visual tokens and components follow [`documentation/design-system.md`](../documentation/design-system.md).

- **Tokens:** `theme/tokens.ts`, `theme/typography.ts`
- **Theme:** wrap app with `ThemeProvider`; consume via `useTheme()` / `useThemedStyles()`
- **Primitives:** `components/ui/*` (Button, Card, Text, Avatar, StatusDot, …)
- **Preview:** navigate to `/dev/ui-kit` in dev builds

```tsx
import { useTheme, useThemedStyles } from '@/theme';
import { Button, Card, BodyText } from '@/components/ui';

const theme = useTheme();
const styles = useThemedStyles((t) => ({
  row: { padding: t.spacing.lg, backgroundColor: t.colors.bgSurfaceRaised, ...t.shadow.card },
}));
```

Do not hardcode hex colors or spacing in screens — import tokens through the theme.

## Icons

UI icons use **[Unicons](https://icon-sets.iconify.design/uil/)** via Iconify (`@iconify-json/uil` + `@iconify/utils` + `react-native-svg`).

```tsx
import { AppIcon } from '@/components/ui';

<AppIcon name="home" size={24} color="#0B5FFF" />
```

- Use semantic names from `AppIcons` in `components/icons/catalog.ts`
- Raw Unicons ids: `<UniconsIcon icon="bookmark" … />`
- License: Unicons by Iconscout — [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

## App structure

```
app/           Expo Router screens (tabs + auth + onboarding + features)
components/    UI, auth layouts, icons (Unicons / Iconify)
lib/           nhost, apollo, i18n, secure session
services/      Domain + Action wrappers (parseRoster, submitReport)
graphql/       Queries, mutations, subscriptions
contexts/      AppProviders (session + Apollo)
hooks/         useSession, useAuthGuard, useVerificationGate
```

## Push notifications

Push is **disabled by default** for local dev (`EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false`). In-app `notifications` GraphQL/subscriptions still work.

To enable later: run `eas init`, set `EXPO_PUBLIC_EAS_PROJECT_ID`, set `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true`, and add the `expo-notifications` plugin back to `app.json`.

## MVP flow

Sign up → create profile → verification → roster upload/confirm → Home presence → Network/Events → chat → report/block via `submitReport` Action.
