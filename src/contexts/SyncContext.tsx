import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncEventType = 'connected' | 'disconnected' | 'synced';

export interface SyncEvent {
  type: SyncEventType;
  at: number;
  detail?: string;
}

interface SyncContextType {
  online: boolean;
  syncing: boolean;
  lastSyncedAt: number | null;
  syncLog: SyncEvent[];
  recordSync: (type: SyncEventType, detail?: string) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);
const SYNC_LOG_KEY = 'larderly:syncLog';
const LAST_SYNC_KEY = 'larderly:lastSync';
const LOG_MAX = 50;

async function readLog(): Promise<SyncEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncLog, setSyncLog] = useState<SyncEvent[]>([]);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY)
      .then((v) => setLastSyncedAt(v ? Number(v) : null))
      .catch(() => {});
    readLog().then(setSyncLog).catch(() => {});
  }, []);

  const recordSync = useCallback((type: SyncEventType, detail?: string) => {
    const now = Date.now();
    if (type === 'synced') {
      AsyncStorage.setItem(LAST_SYNC_KEY, String(now)).catch(() => {});
      setLastSyncedAt(now);
    }
    setSyncLog((prev) => {
      const next = [{ type, at: now, detail }, ...prev].slice(0, LOG_MAX);
      AsyncStorage.setItem(SYNC_LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const Network = await import('expo-network');
        const state = await Network.getNetworkStateAsync();
        const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
        if (cancelled) return;
        if (!isOnline) {
          wasOffline.current = true;
          setOnline(false);
          setSyncing(false);
          if (syncTimer.current) clearTimeout(syncTimer.current);
          recordSync('disconnected');
        } else if (wasOffline.current) {
          wasOffline.current = false;
          setOnline(true);
          setSyncing(true);
          recordSync('connected');
          if (syncTimer.current) clearTimeout(syncTimer.current);
          syncTimer.current = setTimeout(() => {
            setSyncing(false);
            recordSync('synced', 'Reconnected — offline writes flushed');
          }, 2500);
        } else {
          setOnline(true);
        }
      } catch {
        if (!cancelled) setOnline(true);
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [recordSync]);

  return (
    <SyncContext.Provider value={{ online, syncing, lastSyncedAt, syncLog, recordSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
