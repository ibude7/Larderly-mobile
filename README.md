# Larderly Mobile

React Native (Expo) app for [Larderly](https://github.com/ibude7/Larderly-mobile) — pantry tracking, barcode scanning, meal planning, and shopping lists.

## Setup

See **[SETUP.md](./SETUP.md)** for Firebase native config, environment variables, Firestore deploy, and troubleshooting.

```bash
npm install
cp .env.example .env
# Add GoogleService-Info.plist + google-services.json (see SETUP.md)
npm start
```

## Run

```bash
npm start
npm run ios
npm run android
npm run typecheck
```

## Shared code

Business logic shared with the web app lives in **`src/shared/`** (vendored from `@larderly/shared`). See SETUP.md for sync instructions.

## Environment

See `.env.example` for `EXPO_PUBLIC_*` variables (Google Sign-In, dev toggles).
