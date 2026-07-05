import { useColorScheme } from 'react-native';
import { usePrefs } from '../contexts/PreferencesContext';

export type ResolvedTheme = 'light' | 'dark';

export function useTheme(): ResolvedTheme {
  const { prefs } = usePrefs();
  const systemScheme = useColorScheme();
  if (prefs.theme === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return prefs.theme;
}
