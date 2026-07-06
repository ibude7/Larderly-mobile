import { useEffect } from 'react';
import { View, useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme } from 'nativewind';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from './contexts/ToastContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ReauthProvider } from './components/auth/ReauthDialog';
import { PreferencesProvider, usePrefs } from './contexts/PreferencesContext';
import { SyncProvider } from './contexts/SyncContext';
import { AuthProvider } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PantryProvider } from './contexts/PantryContext';
import { MealPlansProvider } from './contexts/MealPlansContext';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import RootNavigator from './navigation/RootNavigator';
import { useTheme } from './hooks/useTheme';


SplashScreen.preventAutoHideAsync();

function ThemeBridge() {
  const { prefs } = usePrefs();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(prefs.theme);
  }, [prefs.theme, setColorScheme]);

  return null;
}

/**
 * Mounts the NetInfo ↔ Firestore network listener.
 * Must sit inside ToastProvider so it can call showToast/removeToast.
 * Renders nothing — side-effects only.
 */
function NetworkSync() {
  useNetworkStatus();
  return null;
}

function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

function ThemedRoot() {
  const { prefs } = usePrefs();
  const systemScheme = useSystemColorScheme();
  const isDark =
    prefs.theme === 'dark' ||
    (prefs.theme === 'system' && systemScheme === 'dark');

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <ThemedStatusBar />
      <ErrorBoundary>
        <RootNavigator />
      </ErrorBoundary>
      <ToastContainer />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SyncProvider>
          <PreferencesProvider>
            <ThemeBridge />
            <ToastProvider>
              <NetworkSync />
              <ConfirmProvider>
                <AuthProvider>
                  <HouseholdProvider>
                    <ProfileProvider>
                      <ReauthProvider>
                        <PantryProvider>
                          <MealPlansProvider>
                            <ThemedRoot />
                          </MealPlansProvider>
                        </PantryProvider>
                      </ReauthProvider>
                    </ProfileProvider>
                  </HouseholdProvider>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </PreferencesProvider>
        </SyncProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
