import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, onSnapshot, setDoc } from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { PreferenceValueProvider } from './PreferenceValueContext';
import { db } from '../lib/firebase';
import {
  createDefaultPreferences,
  createPreferencesEnvelope,
  migratePreferences,
  type Preferences,
  type PreferencesEnvelope,
} from './preferencesSchema';

export {
  PREFERENCES_SCHEMA_VERSION,
  createDefaultPreferences,
  createPreferencesEnvelope,
  migratePreferences,
  normalizePreferences,
} from './preferencesSchema';
export type {
  ColorBlindMode,
  FontScale,
  Language,
  NotifFrequency,
  Preferences,
  PreferencesEnvelope,
  Theme,
  ThemeColor,
} from './preferencesSchema';

const STORAGE_KEY = 'larderly:prefs';
const LOCAL_WRITE_DELAY_MS = 250;
const REMOTE_WRITE_DELAY_MS = 800;

interface PreferencesContextType {
  prefs: Preferences;
  setPrefs: (next: Partial<Preferences>) => void;
  setNotificationPref: (
    key: keyof Preferences['notifications'],
    value: Preferences['notifications'][keyof Preferences['notifications']],
  ) => void;
  reset: () => void;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

async function loadEnvelope(key: string): Promise<PreferencesEnvelope | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? migratePreferences(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function remoteUpdatedAt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === 'function') return toMillis.call(value);
  }
  return 0;
}

function nextUpdatedAt(previous: number): number {
  return Math.max(Date.now(), previous + 1);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isAnonymous, loading: authLoading } = useAuth();
  const [envelope, setEnvelope] = useState<PreferencesEnvelope>(() =>
    createPreferencesEnvelope(createDefaultPreferences(), 0),
  );
  const [ready, setReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const generationRef = useRef(0);
  const updatedAtRef = useRef(0);
  const serverUpdatedAtRef = useRef(0);
  const authenticatedUid = user && !isAnonymous ? user.uid : null;
  const storageKey = authenticatedUid ? `${STORAGE_KEY}:${authenticatedUid}` : STORAGE_KEY;

  useEffect(() => {
    if (authLoading) return;

    const generation = ++generationRef.current;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    setReady(false);
    setRemoteReady(false);
    serverUpdatedAtRef.current = 0;

    const initialize = async () => {
      const scopedLocal = await loadEnvelope(storageKey);
      if (cancelled || generation !== generationRef.current) return;

      let selected = scopedLocal;
      let serverEnvelope: PreferencesEnvelope | null = null;
      const preferenceRef = authenticatedUid
        ? doc(db, 'users', authenticatedUid, 'settings', 'preferences')
        : null;

      if (preferenceRef) {
        try {
          const snapshot = await getDoc(preferenceRef);
          if (cancelled || generation !== generationRef.current) return;
          if (snapshot.metadata.fromCache !== true) setRemoteReady(true);
          if (snapshot.exists()) {
            const data = snapshot.data();
            serverEnvelope = migratePreferences({
              ...data,
              updatedAt: remoteUpdatedAt(data.updatedAt),
            });
            serverUpdatedAtRef.current = serverEnvelope.updatedAt;
          }
        } catch {
          // Local preferences remain usable while Firestore is unavailable.
        }

        // A pre-versioned install only has the former global key. Use it as a
        // one-time seed when neither this account nor the server has settings.
        if (!selected && !serverEnvelope) {
          selected = await loadEnvelope(STORAGE_KEY);
        }
      }

      if (serverEnvelope && (!selected || serverEnvelope.updatedAt >= selected.updatedAt)) {
        selected = serverEnvelope;
      }
      if (!selected) {
        selected = createPreferencesEnvelope(createDefaultPreferences(), Date.now());
      } else if (selected.updatedAt === 0 && !serverEnvelope) {
        selected = createPreferencesEnvelope(selected.preferences, Date.now());
      }

      if (cancelled || generation !== generationRef.current) return;
      updatedAtRef.current = selected.updatedAt;
      setEnvelope(selected);
      setReady(true);

      if (preferenceRef) {
        unsubscribe = onSnapshot(
          preferenceRef,
          (snapshot) => {
            if (generation !== generationRef.current) return;
            if (snapshot.metadata.fromCache !== true) setRemoteReady(true);
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            const incoming = migratePreferences({
              ...data,
              updatedAt: remoteUpdatedAt(data.updatedAt),
            });
            serverUpdatedAtRef.current = Math.max(
              serverUpdatedAtRef.current,
              incoming.updatedAt,
            );
            if (incoming.updatedAt > updatedAtRef.current) {
              updatedAtRef.current = incoming.updatedAt;
              setEnvelope(incoming);
            }
          },
          () => {
            // Preference sync failures must not block the app.
          },
        );
      }
    };

    initialize().catch(() => {
      if (!cancelled && generation === generationRef.current) {
        const fallback = createPreferencesEnvelope(createDefaultPreferences(), Date.now());
        updatedAtRef.current = fallback.updatedAt;
        setEnvelope(fallback);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [authLoading, authenticatedUid, storageKey]);

  useEffect(() => {
    if (!ready) return;
    const localTimer = setTimeout(() => {
      AsyncStorage.setItem(storageKey, JSON.stringify(envelope)).catch(() => {});
    }, LOCAL_WRITE_DELAY_MS);

    const remoteTimer = authenticatedUid && remoteReady
      ? setTimeout(() => {
          if (envelope.updatedAt <= serverUpdatedAtRef.current) return;
          setDoc(
            doc(db, 'users', authenticatedUid, 'settings', 'preferences'),
            envelope,
            { merge: true },
          )
            .then(() => {
              serverUpdatedAtRef.current = Math.max(
                serverUpdatedAtRef.current,
                envelope.updatedAt,
              );
            })
            .catch(() => {});
        }, REMOTE_WRITE_DELAY_MS)
      : undefined;

    return () => {
      clearTimeout(localTimer);
      if (remoteTimer) clearTimeout(remoteTimer);
    };
  }, [authenticatedUid, envelope, ready, remoteReady, storageKey]);

  const setPrefs = useCallback((next: Partial<Preferences>) => {
    setEnvelope((previous) => {
      const updatedAt = nextUpdatedAt(updatedAtRef.current);
      updatedAtRef.current = updatedAt;
      return createPreferencesEnvelope(
        { ...previous.preferences, ...next },
        updatedAt,
      );
    });
  }, []);

  const setNotificationPref = useCallback((
    key: keyof Preferences['notifications'],
    value: Preferences['notifications'][keyof Preferences['notifications']],
  ) => {
    setEnvelope((previous) => {
      const updatedAt = nextUpdatedAt(updatedAtRef.current);
      updatedAtRef.current = updatedAt;
      return createPreferencesEnvelope(
        {
          ...previous.preferences,
          notifications: { ...previous.preferences.notifications, [key]: value },
        },
        updatedAt,
      );
    });
  }, []);

  const reset = useCallback(() => {
    const updatedAt = nextUpdatedAt(updatedAtRef.current);
    updatedAtRef.current = updatedAt;
    setEnvelope(createPreferencesEnvelope(createDefaultPreferences(), updatedAt));
  }, []);

  const value = useMemo(
    () => ({ prefs: envelope.preferences, setPrefs, setNotificationPref, reset, ready }),
    [envelope.preferences, ready, reset, setNotificationPref, setPrefs],
  );

  return (
    <PreferencesContext.Provider value={value}>
      <PreferenceValueProvider value={envelope.preferences}>
        {children}
      </PreferenceValueProvider>
    </PreferencesContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePrefs must be used within PreferencesProvider');
  return ctx;
}
