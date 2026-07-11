import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PhoneSignInScreen from '../screens/auth/PhoneSignInScreen';
import PhoneVerifyScreen from '../screens/auth/PhoneVerifyScreen';
import MfaVerifyScreen from '../screens/auth/MfaVerifyScreen';
import { useAuth } from '../contexts/AuthContext';
import { AuthFlowProvider } from '../contexts/AuthFlowContext';
import { AuthStackParamList, AuthStackNavigationProp } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function MfaRedirect() {
  const { mfaResolver } = useAuth();
  const navigation = useNavigation<AuthStackNavigationProp>();

  useEffect(() => {
    if (mfaResolver) {
      navigation.navigate('MfaVerify');
    }
  }, [mfaResolver, navigation]);

  return null;
}

export default function AuthNavigator() {
  return (
    <AuthFlowProvider>
      <MfaRedirect />
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationTypeForReplace: 'push',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="PhoneSignIn" component={PhoneSignInScreen} />
        <Stack.Screen name="PhoneVerify" component={PhoneVerifyScreen} />
        <Stack.Screen name="MfaVerify" component={MfaVerifyScreen} />
      </Stack.Navigator>
    </AuthFlowProvider>
  );
}
