# Larderly Mobile — Setup Guide

React Native (Expo) client for the Larderly pantry app. It shares Firestore data with the web app on project **`larderly1`**, database **`larderly`**.

## Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (or use `npx expo`)
- Xcode (iOS) and/or Android Studio (Android) for device builds
- Access to the **larderly1** Firebase project

## 1. Install dependencies

```bash
npm install
cp .env.example .env
```

## 2. Firebase native config

`@react-native-firebase` reads config from native files, **not** from `.env`.

1. Open [Firebase Console → larderly1](https://console.firebase.google.com/project/larderly1)
2. Register an **iOS** app (bundle ID: `com.larderly.app`) and/or **Android** app (package: `com.larderly.app`)
3. Download and place at the project root:
   - `GoogleService-Info.plist` (iOS)
   - `google-services.json` (Android)

These files are gitignored. The app builds without them but Firebase will not initialize until they exist.

## 3. Environment variables

Edit `.env`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` | Reversed client ID from `GoogleService-Info.plist` (iOS Google Sign-In) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web OAuth client ID for `@react-native-google-signin` |
| `EXPO_PUBLIC_BYPASS_AUTH` | Set `true` to skip auth gate during UI dev |

## 4. Firestore rules & indexes

Rules and indexes live in the repo root:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json` (named database `larderly` — object format required for index deploy)

Deploy (requires Firebase CLI login):

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Run the app

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator / device
npm run android    # Android emulator / device
npm run typecheck  # TypeScript
```

For a native build with Firebase:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## 6. Shared code (`src/shared/`)

Mappers and constants are **vendored** from the web monorepo package `@larderly/shared` (previously linked as `file:../Larderly/packages/shared`). When the web package changes, sync these files manually:

- `constants.ts`
- `householdMapper.ts`
- `shoppingMapper.ts`
- `utils.ts`
- `index.ts`

## Data model (Firestore)

| Path | Used for |
|------|----------|
| `users/{uid}` | Profile, preferences, householdId |
| `users/{uid}/meal_plans`, `favorites`, `notifications`, … | Per-user features |
| `households/{hid}/inventory` | **Pantry items** (primary) |
| `households/{hid}/storageLocations` | **Storage locations** (primary) |
| `households/{hid}/shoppingLists/{listId}/items` | Shopping lists |
| `households/{hid}/activity`, `reminders`, `recipeViews` | Household activity |
| `inviteCodes/{code}` | Household join codes |
| `products/{barcode}` | Barcode product cache |

Legacy user-scoped paths (`users/{uid}/storage_locations`, `pantry_items`) are kept for migration cleanup only.

## Troubleshooting

- **Stuck on loading spinner** — Firebase auth did not initialize; check native config files.
- **Permission denied on Firestore** — deploy latest `firestore.rules`; confirm user is a household member.
- **Google Sign-In fails** — verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and iOS URL scheme.
- **Index required** — deploy `firestore.indexes.json` and wait for index build in Firebase Console.
