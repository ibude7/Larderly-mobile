import {
  Beef,
  Fish,
  Leaf,
  ShoppingBasket,
  ShoppingCart,
  Wheat,
  Wine,
} from '../components/ui/Glyph';
import type { GlyphIcon } from '../components/ui/Glyph';
import { accentPalette } from '../theme/landing';

export const ONBOARDING_STEPS = [
  'Profile',
  'Household',
  'Invite',
  'Dietary',
  'Stores',
  'Notifications',
  'Scan',
  'ConfirmPantry',
  'Finish',
] as const;

export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number];

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

/** Base title (roman). Accent is italic, step-colored. */
export const ONBOARDING_STEP_TITLES: Record<OnboardingStepName, string> = {
  Profile: 'Your ',
  Household: 'Your ',
  Invite: 'Invite ',
  Dietary: 'Dietary ',
  Stores: 'Where you ',
  Notifications: 'Stay ',
  Scan: 'Scan an ',
  ConfirmPantry: 'Add to ',
  Finish: "You're ",
};

export const ONBOARDING_STEP_ACCENTS: Record<OnboardingStepName, string> = {
  Profile: 'profile.',
  Household: 'household.',
  Invite: 'family.',
  Dietary: 'needs.',
  Stores: 'shop.',
  Notifications: 'notified.',
  Scan: 'item.',
  ConfirmPantry: 'pantry.',
  Finish: 'all set.',
};

export const ONBOARDING_STEP_SUBCOPY: Record<OnboardingStepName, string> = {
  Profile: 'Name and photo so your household knows it is you.',
  Household: 'Create a household or join with an invite code.',
  Invite: 'Share a code — family can join in seconds.',
  Dietary: 'What you eat, and anything to avoid.',
  Stores: 'Pick your stores for smarter shopping lists.',
  Notifications: 'Expiry alerts, low stock, and household updates.',
  Scan: 'Point at a barcode or try a demo product.',
  ConfirmPantry: 'Check quantity and storage, then save it.',
  Finish: 'Your pantry is ready — open your dashboard.',
};

export const ONBOARDING_STEP_PHASES: Record<OnboardingStepName, string> = {
  Profile: 'Setup',
  Household: 'Setup',
  Invite: 'Setup',
  Dietary: 'Preferences',
  Stores: 'Preferences',
  Notifications: 'Preferences',
  Scan: 'First item',
  ConfirmPantry: 'First item',
  Finish: 'First item',
};

export const ONBOARDING_STEP_ACCENT_COLORS: Record<OnboardingStepName, string> = {
  Profile: accentPalette.dustyBlue,
  Household: accentPalette.sage,
  Invite: accentPalette.plum,
  Dietary: accentPalette.teal,
  Stores: accentPalette.ochre,
  Notifications: accentPalette.clay,
  Scan: accentPalette.terracotta,
  ConfirmPantry: accentPalette.sage,
  Finish: accentPalette.terracotta,
};

export const DIET_OPTION_ICONS: Record<string, GlyphIcon> = {
  Vegetarian: Leaf,
  Vegan: Leaf,
  'Gluten-Free': Wheat,
  Keto: Beef,
  Paleo: Beef,
  Pescatarian: Fish,
  Halal: Beef,
  Kosher: Wine,
};

export const STORE_OPTION_ICONS: Record<string, GlyphIcon> = {
  'Whole Foods': Leaf,
  "Trader Joe's": ShoppingBasket,
  Costco: ShoppingCart,
  Target: ShoppingCart,
  Walmart: ShoppingCart,
  Kroger: ShoppingCart,
  Safeway: ShoppingCart,
  Publix: ShoppingCart,
  Aldi: ShoppingCart,
};

export function getOnboardingStepIndex(name: string): number {
  const idx = ONBOARDING_STEPS.indexOf(name as OnboardingStepName);
  return idx >= 0 ? idx : 0;
}

export const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Keto',
  'Paleo',
  'Pescatarian',
  'Halal',
  'Kosher',
];

export const STORE_OPTIONS = [
  'Whole Foods',
  "Trader Joe's",
  'Costco',
  'Target',
  'Walmart',
  'Kroger',
  'Safeway',
  'Publix',
  'Aldi',
];
