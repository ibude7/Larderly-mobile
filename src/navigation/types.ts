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

export type AuthStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  PhoneSignIn: undefined;
  PhoneVerify: undefined;
  MfaVerify: undefined;
};

export type OnboardingStackParamList = {
  Profile: undefined;
  Household: undefined;
  Invite: undefined;
  Dietary: undefined;
  Stores: undefined;
  Notifications: undefined;
  Scan: undefined;
  ConfirmPantry: undefined;
  Finish: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Settings: undefined;
  SettingsAccount: undefined;
  SettingsHousehold: undefined;
  SettingsNotifications: undefined;
  SettingsPermissions: undefined;
  SettingsSecurity: undefined;
  SettingsData: undefined;
  SettingsPreferences: undefined;
  SettingsSupport: undefined;
  SettingsAbout: undefined;
  SettingsDiagnostics: undefined;
  Search: undefined;
  Join: { code: string };
  Achievements: undefined;
  Notifications: undefined;
  Reminders: undefined;
  Nutrition: undefined;
  Analytics: undefined;
  MealPlanner: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type OnboardingStackNavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;
export type MainStackNavigationProp = NativeStackNavigationProp<MainStackParamList>;
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Bottom-tab screens only (no stack routes). */
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Tab screens that also navigate to main stack routes (Settings, Search, …). */
export type TabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<MainStackParamList>
>;
