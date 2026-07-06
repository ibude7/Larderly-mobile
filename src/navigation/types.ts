import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Dashboard: undefined;
  Pantry: { openAdd?: boolean; filterExpiration?: string } | undefined;
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

/** Stack screens pushed above the tab navigator. */
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Bottom-tab screens only (no stack routes). */
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Tab screens that also navigate to root stack routes (Settings, Search, …). */
export type TabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;
