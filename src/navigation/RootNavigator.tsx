import { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';
import AuthScreen from '../screens/AuthScreen';
import TabsNavigator from './TabsNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import SearchScreen from '../screens/SearchScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import JoinScreen from '../screens/JoinScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import AnonymousUpgradeBanner from '../components/auth/AnonymousUpgradeBanner';
import EmailVerificationBanner from '../components/auth/EmailVerificationBanner';
import OfflineBanner from '../components/layout/OfflineBanner';
import { RootStackParamList } from './types';
import { useAppColors } from '../hooks/useAppColors';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainWithBanners() {
  return (
    <View className="flex-1">
      <OfflineBanner />
      <AnonymousUpgradeBanner />
      <EmailVerificationBanner />
      <TabsNavigator />
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading, householdId, userProfile } = useAuth();
  const c = useAppColors();
  const navTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: c.canvas,
        primary: c.primary,
        card: c.surface,
        text: c.ink,
        border: c.line,
      },
    }),
    [c],
  );
  const bypass = Boolean((Constants.expoConfig?.extra as { bypassAuth?: boolean } | undefined)?.bypassAuth);

  if (loading) return <LoadingScreen />;

  const authed = !!user || bypass;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authed ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !householdId ? (
          <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
        ) : userProfile && !userProfile.onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainWithBanners} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Reminders" component={RemindersScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="MealPlanner" component={MealPlannerScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Join" component={JoinScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ presentation: 'card' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
