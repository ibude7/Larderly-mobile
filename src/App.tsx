import { useEffect, useRef } from 'react';
import { View, useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useFonts } from '@expo-google-fonts/outfit';
import { TamaguiProvider } from 'tamagui';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { Geist_600SemiBold, Geist_600SemiBold_Italic } from '@expo-google-fonts/geist';
import { Fraunces_600SemiBold, Fraunces_600SemiBold_Italic, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import { PantryProvider } from './contexts/PantryContext';
import { LocaleProvider } from './i18n';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import RootNavigator from './navigation/RootNavigator';
import { useTheme } from './hooks/useTheme';
import { AccentProvider, THEME_COLOR_TOKENS } from './theme/accent';
import { setAnalyticsPreferenceEnabled } from './lib/analytics';
import { analytics } from './lib/firebase';
import { toFirestoreNotificationPrefs } from './lib/notificationPrefs';
import { setNotificationPresentationPrefs } from './lib/push';
import { tamaguiConfig } from '../tamagui.config';


SplashScreen.preventAutoHideAsync();

function ThemeBridge() {
  const { prefs } = usePrefs();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(prefs.theme);
  }, [prefs.theme, setColorScheme]);

  return null;
}

/** Mirrors prefs.privacy.analytics into Firebase Analytics collection. */
function AnalyticsBridge() {
  const { prefs, ready } = usePrefs();
  const { user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const enabled = prefs.privacy.analytics;
    void (async () => {
      await setAnalyticsPreferenceEnabled(enabled);
      try {
        if (enabled) {
          await analytics().setUserId(user && !user.isAnonymous ? user.uid : null);
        }
      } catch {
        // Analytics should never block user workflows.
      }
    })();
  }, [prefs.privacy.analytics, ready, user]);

  return null;
}

/**
 * Applies sound prefs to the foreground handler and syncs notification
 * choices to `users/{uid}.notificationPrefs` for Cloud Function delivery.
 */
function NotificationPrefsBridge() {
  const { prefs, ready } = usePrefs();
  const { user, isAnonymous } = useAuth();
  const { updateUserPreferences } = useProfile();
  const lastSyncedJson = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    setNotificationPresentationPrefs({
      sound: prefs.notifications.sound,
      vibrate: prefs.notifications.vibrate,
    });
  }, [prefs.notifications.sound, prefs.notifications.vibrate, ready]);

  useEffect(() => {
    if (!ready || !user || isAnonymous) return;
    const payload = toFirestoreNotificationPrefs(prefs.notifications);
    const serialized = JSON.stringify(payload);
    if (lastSyncedJson.current === serialized) return;
    const timer = setTimeout(() => {
      void updateUserPreferences({ notificationPrefs: payload }).then(({ error }) => {
        if (!error) lastSyncedJson.current = serialized;
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [isAnonymous, prefs.notifications, ready, updateUserPreferences, user]);

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
  const accentColor =
    THEME_COLOR_TOKENS[prefs.themeColor]?.primary ?? THEME_COLOR_TOKENS.orange.primary;

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'settings_dark' : 'settings_light'}>
      <AccentProvider color={accentColor}>
        <View className={isDark ? 'dark flex-1' : 'flex-1'}>
          <ThemedStatusBar />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
          <ToastContainer />
        </View>
      </AccentProvider>
    </TamaguiProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Geist_600SemiBold,
    Geist_600SemiBold_Italic,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SyncProvider>
          <AuthProvider>
            <PreferencesProvider>
              <LocaleProvider>
                <ThemeBridge />
                <AnalyticsBridge />
                <ToastProvider>
                  <NetworkSync />
                  <ConfirmProvider>
                    <HouseholdProvider>
                      <ProfileProvider>
                        <NotificationPrefsBridge />
                        <ReauthProvider>
                          <PantryProvider>
                            <ThemedRoot />
                          </PantryProvider>
                        </ReauthProvider>
                      </ProfileProvider>
                    </HouseholdProvider>
                  </ConfirmProvider>
                </ToastProvider>
              </LocaleProvider>
            </PreferencesProvider>
          </AuthProvider>
        </SyncProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
