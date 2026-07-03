import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Currency, UnitSystem } from '../lib/format';

export type Theme = 'light' | 'dark';
export type ThemeColor = 'orange' | 'blue' | 'green' | 'purple' | 'rose';
export type Language = 'en' | 'es' | 'fr';
export type FontScale = 'sm' | 'md' | 'lg';
export type NotifFrequency = 'realtime' | 'daily' | 'weekly';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface Preferences {
  theme: Theme;
  themeColor: ThemeColor;
  language: Language;
  currency: Currency;
  units: UnitSystem;
  fontScale: FontScale;
  colorBlindMode: ColorBlindMode;
  notifications: {
    expiration: boolean;
    lowStock: boolean;
    activity: boolean;
    deals: boolean;
    recipes: boolean;
    budget: boolean;
    achievements: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
    frequency: NotifFrequency;
    sound: boolean;
    vibrate: boolean;
  };
  privacy: {
    analytics: boolean;
    personalizedAds: boolean;
  };
  integrations: {
    appleHealth: boolean;
    googleFit: boolean;
    smartHome: boolean;
  };
}

const DEFAULTS: Preferences = {
  theme: 'light',
  themeColor: 'orange',
  language: 'en',
  currency: 'USD',
  units: 'imperial',
  fontScale: 'md',
  colorBlindMode: 'none',
  notifications: {
    expiration: true,
    lowStock: true,
    activity: true,
    deals: false,
    recipes: true,
    budget: true,
    achievements: true,
    quietHoursStart: 21,
    quietHoursEnd: 8,
    frequency: 'realtime',
    sound: true,
    vibrate: true,
  },
  privacy: { analytics: true, personalizedAds: false },
  integrations: { appleHealth: false, googleFit: false, smartHome: false },
};

const STORAGE_KEY = 'larderly:prefs';

interface PreferencesContextType {
  prefs: Preferences;
  setPrefs: (next: Partial<Preferences>) => void;
  setNotificationPref: (key: keyof Preferences['notifications'], value: boolean | number) => void;
  reset: () => void;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

async function loadPrefs(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications ?? {}) },
      privacy: { ...DEFAULTS.privacy, ...(parsed.privacy ?? {}) },
      integrations: { ...DEFAULTS.integrations, ...(parsed.integrations ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPrefs().then((p) => {
      setPrefsState(p);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, ready]);

  const setPrefs = useCallback((next: Partial<Preferences>) => {
    setPrefsState((prev) => ({ ...prev, ...next }));
  }, []);

  const setNotificationPref = useCallback((key: keyof Preferences['notifications'], value: boolean | number) => {
    setPrefsState((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
  }, []);

  const reset = useCallback(() => setPrefsState(DEFAULTS), []);

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs, setNotificationPref, reset, ready }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePrefs must be used within PreferencesProvider');
  return ctx;
}
