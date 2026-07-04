# Larderly Mobile

React Native (Expo) app for [Larderly](https://github.com/ibude7/Larderly) — pantry tracking, barcode scanning, meal planning, and shopping lists.

## Setup

```bash
npm install
cp .env.example .env
```

Add Firebase native config from the Firebase console (not committed to git):

- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)

## Shared code with web

Types, Firestore path helpers, and household mappers come from `@larderly/shared` (local path: `../Larderly/packages/shared`). After pulling web repo changes that touch shared code, run `npm install` again in this repo.

## Run

```bash
npm start
npm run ios
npm run android
```

## Environment

See `.env.example` for `EXPO_PUBLIC_*` variables (Google Sign-In, dev toggles).
