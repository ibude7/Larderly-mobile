import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Dashboard: undefined;
  Pantry: { openAdd?: boolean } | undefined;
  Scanner: { mode?: 'add' | 'consume' } | undefined;
  Shopping: undefined;
  Meals: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Auth: undefined;
  HouseholdSetup: undefined;
  Onboarding: undefined;
  Join: { code: string };
  Settings: undefined;
  Search: undefined;
  Achievements: undefined;
  Notifications: undefined;
  Reminders: undefined;
  Nutrition: undefined;
  Analytics: undefined;
  MealPlanner: undefined;
};
