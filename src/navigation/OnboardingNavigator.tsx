import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingSessionProvider } from '../contexts/OnboardingSessionContext';
import ProfileStepScreen from '../screens/onboarding/ProfileStepScreen';
import HouseholdStepScreen from '../screens/onboarding/HouseholdStepScreen';
import InviteStepScreen from '../screens/onboarding/InviteStepScreen';
import DietaryStepScreen from '../screens/onboarding/DietaryStepScreen';
import StoresStepScreen from '../screens/onboarding/StoresStepScreen';
import NotificationsStepScreen from '../screens/onboarding/NotificationsStepScreen';
import ScanStepScreen from '../screens/onboarding/ScanStepScreen';
import ConfirmPantryStepScreen from '../screens/onboarding/ConfirmPantryStepScreen';
import FinishStepScreen from '../screens/onboarding/FinishStepScreen';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <OnboardingSessionProvider>
      <Stack.Navigator
        initialRouteName="Profile"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationTypeForReplace: 'push',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="Profile" component={ProfileStepScreen} />
        <Stack.Screen name="Household" component={HouseholdStepScreen} />
        <Stack.Screen name="Invite" component={InviteStepScreen} />
        <Stack.Screen name="Dietary" component={DietaryStepScreen} />
        <Stack.Screen name="Stores" component={StoresStepScreen} />
        <Stack.Screen name="Notifications" component={NotificationsStepScreen} />
        <Stack.Screen name="Scan" component={ScanStepScreen} />
        <Stack.Screen name="ConfirmPantry" component={ConfirmPantryStepScreen} />
        <Stack.Screen name="Finish" component={FinishStepScreen} />
      </Stack.Navigator>
    </OnboardingSessionProvider>
  );
}
