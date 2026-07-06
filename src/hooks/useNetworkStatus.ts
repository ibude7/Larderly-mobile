import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { disableNetwork, enableNetwork } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../contexts/ToastContext';

const OFFLINE_TOAST_ID = '__larderly_offline__';

interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
}

function getNetworkStatus(state: NetInfoState): NetworkStatus {
  const isInternetReachable = state.isInternetReachable;
  return {
    isOnline: Boolean(state.isConnected && isInternetReachable !== false),
    isInternetReachable,
  };
}

export function useNetworkStatus(): NetworkStatus {
  const { showToast, removeToast } = useToast();
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    let previousOnline: boolean | null = null;

    const onNetworkStatusChange = async (state: NetInfoState) => {
      const nextStatus = getNetworkStatus(state);
      setStatus(nextStatus);

      const wasOnline = previousOnline;
      if (wasOnline === nextStatus.isOnline) return;
      previousOnline = nextStatus.isOnline;

      if (!nextStatus.isOnline) {
        try {
          await disableNetwork(db);
        } catch {
          // Firestore may already be offline.
        }
        showToast(
          "You're offline — changes will sync when you reconnect.",
          'warning',
          0,
          OFFLINE_TOAST_ID,
        );
        return;
      }

      try {
        await enableNetwork(db);
      } catch {
        // Firestore may already be online.
      }
      removeToast(OFFLINE_TOAST_ID);
      if (wasOnline === false) {
        showToast('Back online — syncing your changes.', 'success', 3000);
      }
    };

    const unsubscribe = NetInfo.addEventListener(onNetworkStatusChange);
    return unsubscribe;
  }, [removeToast, showToast]);

  return status;
}
