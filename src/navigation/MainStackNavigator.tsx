import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabsNavigator from './TabsNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import SettingsAccountScreen from '../screens/settings/SettingsAccountScreen';
import SettingsHouseholdScreen from '../screens/settings/SettingsHouseholdScreen';
import SettingsNotificationsScreen from '../screens/settings/SettingsNotificationsScreen';
import SettingsSecurityScreen from '../screens/settings/SettingsSecurityScreen';
import SettingsDataScreen from '../screens/settings/SettingsDataScreen';
import SettingsPreferencesScreen from '../screens/settings/SettingsPreferencesScreen';
import SettingsPermissionsScreen from '../screens/settings/SettingsPermissionsScreen';
import SettingsSupportScreen from '../screens/settings/SettingsSupportScreen';
import SettingsAboutScreen from '../screens/settings/SettingsAboutScreen';
import SettingsDiagnosticsScreen from '../screens/settings/SettingsDiagnosticsScreen';
import SearchScreen from '../screens/SearchScreen';
import JoinScreen from '../screens/JoinScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SettingsAccount" component={SettingsAccountScreen} />
      <Stack.Screen name="SettingsHousehold" component={SettingsHouseholdScreen} />
      <Stack.Screen name="SettingsNotifications" component={SettingsNotificationsScreen} />
      <Stack.Screen name="SettingsPermissions" component={SettingsPermissionsScreen} />
      <Stack.Screen name="SettingsSecurity" component={SettingsSecurityScreen} />
      <Stack.Screen name="SettingsData" component={SettingsDataScreen} />
      <Stack.Screen name="SettingsPreferences" component={SettingsPreferencesScreen} />
      <Stack.Screen name="SettingsSupport" component={SettingsSupportScreen} />
      <Stack.Screen name="SettingsAbout" component={SettingsAboutScreen} />
      <Stack.Screen name="SettingsDiagnostics" component={SettingsDiagnosticsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Join" component={JoinScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="MealPlanner" component={MealPlannerScreen} />
    </Stack.Navigator>
  );
}
