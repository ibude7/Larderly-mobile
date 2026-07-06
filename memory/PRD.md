# Larderly Mobile — PRD & Progress Memory

## Original Problem Statement
"The app looks too boring, generic, ugly, and outdated. I want you to do a complete redesign, theme, icons, UI, graphics, animations, architecture, the whole frontend overhaul for the entire app (every single page, beginning to end). And build new features. I want a premium modern 2026 frontend designs. Retain the app logo. The app should feel like a modern and enticing digital pantry and inventory tracking system."

### User Choices
- Visual vibe: Fresh & vibrant + let the design expert decide
- Features: All (expiry alerts, smart shopping, dashboard stats, barcode/quick-add, AI recipes)
- Backend changes allowed if needed
- AI recipe suggestions: yes (already exists via Firebase AI cloud functions — no Emergent key needed)

## App Overview
- **Larderly**: React Native (Expo 57) pantry/inventory app. NOT the standard React+FastAPI template.
- Stack: Expo, NativeWind (Tailwind), react-native-reanimated 4, expo-blur, expo-linear-gradient, @react-native-firebase (auth/firestore/functions/AI), lottie.
- Cannot run in this container (native Firebase modules, no emulator). Verification = `npx tsc --noEmit` (app-side clean; `functions/` errors are pre-existing, deps not installed there), `npx jest` (34/34 pass), `npx eslint` (1 pre-existing error in ComingSoonScreen), Metro bundle export (3865 modules resolve; hermesc binary incompatible with container — env issue only).
- Uses **npm** (package-lock.json), not yarn.
- Screens live in `/app/src/screens/` (20 screens); design tokens in `/app/src/theme.ts` + `tailwind.config.js`; semantic icons in `/app/src/components/ui/Icon.tsx`.

## Design System: "Orchard OS" (from /app/design_guidelines.json)
- Colors: radish pink `#FF3366` primary, yuzu yellow `#FFB800/#FFD600`, fresh green/teal `#00C896`; light `#F5F4F0` canvas / dark `#0F1410` botanical dark. Full light+dark tokens in theme.ts.
- Typography: **Fraunces** (display headings, class `font-display`) + **Outfit** (body; `font-sans/medium/semibold/bold/black` mapped to Outfit weights in tailwind config).
- Icons: **lucide-react-native**, strokeWidth 2.5, swapped app-wide via Icon.tsx (google/apple logos remain Ionicons).
- Motion: reanimated springs (damping 14, stiffness 120), FadeInUp staggered entrances.
- Logo: RETAINED as-is (orange AppLogo mark) per user request.

## What's Been Implemented (2026-06)
1. **Global re-skin**: new theme.ts + tailwind.config tokens (both modes); replaced all 515 hardcoded `dark:[#hex]` classes with token classes; heading typography sweep to Fraunces; splash bg updated in app.config.js.
2. **Fonts**: @expo-google-fonts/outfit + fraunces installed & loaded in src/App.tsx.
3. **Icons**: full lucide swap in Icon.tsx.
4. **Components upgraded**: TabBar (floating glass dock, animated active pill, gradient raised scan FAB), Button (gradient primary pill), Badge (vivid solid), Chip, StatTileRow (bento asymmetric-corner vivid tiles), ExpiryAlertBanner (pink-orange gradient hero), InventoryCard (+ expiry countdown chip), AppHeader (Fraunces greeting), MetricTile fonts.
5. **Screens polished**: Dashboard (staggered FadeInUp, teal Pantry Value gradient), Recipes ("Kitchen" editorial header, FAB moved above tab bar), Auth (Fraunces wordmark), Shopping.
6. **New feature — Smart Restock**: `src/components/shopping/SmartRestockCard.tsx` on Shopping screen; one-tap bulk-add of low/out-of-stock pantry items not already on the list (uses bulkAddItems); analytics event `smart_restock_used` added.
7. **Tests**: added `src/components/ui/__tests__/redesign.test.tsx` (RNTL 14 — note: `render` is async, must await); jest.config testMatch extended; installed @react-native/jest-preset, react-test-renderer, test-renderer dev deps.

### Phase 2 (2026-06) — deep screen redesigns
8. **RecipeCard**: full magazine rewrite — 200px photo hero (recipe.imageUrl or curated cuisine-keyed Unsplash fallbacks in CUISINE_IMAGES), cinematic scrim, Fraunces title overlay, availability/AI/allergen chips, glass save button, meta row + Cook CTA.
9. **Onboarding**: Lottie block replaced with cinematic image hero (230px, asymmetric corners, scrim, STEP pill + Fraunces title overlay); STEP_IMAGES cycles 3 curated design-system photos.
10. **Pantry toolbar cleanup**: title+subtitle row, search, single compact action row (Voice / Photo AI / select icon-toggle), contextual bulk actions only when items selected; dark-mode classes added to screen root.
11. **Analytics**: vivid bento stat tiles (pink/surface/teal/yellow, asymmetric corners, Fraunces numbers), Fraunces section titles.
12. **Achievements**: vivid gamified StatBoxes (pink/yellow/teal tones).
13. **Nutrition**: Today card hero — giant Fraunces teal calorie number, thicker teal progress bar, asymmetric corner.
14. **Search**: ink-pill segmented tabs, cleaner header (no heavy border band).
15. Fixed pre-existing eslint error (ComingSoonScreen require) with disable comment.
Verified: tsc clean, eslint clean, jest 34/34, full Metro iOS bundle (`npx expo export --platform ios --no-bytecode`) = 3861 modules OK.

Pre-existing features confirmed present (not rebuilt): expiry tracking + notifications, dashboard stats (useDashboardStats), barcode scanner w/ animated scan line, AI recipes (recipeGen via Firebase AI), voice add, receipt scan, shopping templates/budget, households, achievements, analytics.

## Backlog / Next Tasks
- P2: Scanner glass overlay refinement per guidelines; staggered pantry list entrances.
- P2: Recipe detail modal → full editorial bottom sheet with hero image.
- P2: Unused lottie assets (household/pantry/shopping/scan.json) still shipped — only meal-planner one used now.
- Note: user must build via `npm run ios/android` on their machine to see results; Firebase native config files are gitignored.
