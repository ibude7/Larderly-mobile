import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ReauthProvider } from './components/auth/ReauthDialog';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { SyncProvider } from './contexts/SyncContext';
import { AuthProvider } from './contexts/AuthContext';
import { PantryProvider } from './contexts/PantryContext';
import { MealPlansProvider } from './contexts/MealPlansContext';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SyncProvider>
          <PreferencesProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <ReauthProvider>
                    <PantryProvider>
                      <MealPlansProvider>
                        <ErrorBoundary>
                          <RootNavigator />
                        </ErrorBoundary>
                      </MealPlansProvider>
                    </PantryProvider>
                    <ToastContainer />
                  </ReauthProvider>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </PreferencesProvider>
        </SyncProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
