/**
 * useNetworkSync — wires Firestore offline mode and the "You're offline" toast.
 *
 * Must be rendered inside `ToastProvider`. Calls `initFirestoreNetworkListener`
 * from firebase.ts once on mount and cleans up on unmount.
 *
 * Usage (in App.tsx, as a child of ToastProvider):
 *   function NetworkSync() {
 *     useNetworkSync();
 *     return null;
 *   }
 */

import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { initFirestoreNetworkListener } from '../lib/firebase';

export function useNetworkSync(): void {
  const { showToast, removeToast } = useToast();

  useEffect(() => {
    const unsubscribe = initFirestoreNetworkListener(showToast, removeToast);
    return unsubscribe;
  }, [showToast, removeToast]);
}
