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

### Phase 3 (2026-06) — guided cooking
16. **RecipeDetailSheet** (`src/components/meals/RecipeDetailSheet.tsx`): full-screen editorial recipe sheet replacing the old modal in RecipesScreen — 320px photo hero w/ scrim + Fraunces title + meta chips (time/servings/kcal), ingredient checklist with pantry availability (teal check vs "Missing" + add-missing-to-list CTA), tappable 5-star rating, sticky "Start cooking" CTA. **Cook mode**: progress bar, checkable step cards (current step highlighted pink, done steps teal + strikethrough, haptics), "Bon appétit" celebration card when all steps done, finish → marks cooked. Sheet hides while the save-to-collection modal is open (sibling RN Modal iOS conflict); cook progress persists (reset keyed on recipe.id only). CUISINE_IMAGES exported from RecipeCard for reuse.
Verified: tsc clean, eslint clean, jest 34/34, Metro iOS bundle 3861 modules OK.

Pre-existing features confirmed present (not rebuilt): expiry tracking + notifications, dashboard stats (useDashboardStats), barcode scanner w/ animated scan line, AI recipes (recipeGen via Firebase AI), voice add, receipt scan, shopping templates/budget, households, achievements, analytics.

## Backlog / Next Tasks
- P2: Scanner glass overlay refinement; staggered pantry list entrances.
- P2: Keep-screen-awake during cook mode (expo-keep-awake not installed yet).
- P2: Unused lottie assets (household/pantry/shopping/scan.json) still shipped — only meal-planner one used now.
- Note: user must build via `npm run ios/android` on their machine to see results; Firebase native config files are gitignored.
