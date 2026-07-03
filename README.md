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

## Run

```bash
npm start
npm run ios
npm run android
```

## Environment

See `.env.example` for `EXPO_PUBLIC_*` variables (Google Sign-In, dev toggles).
