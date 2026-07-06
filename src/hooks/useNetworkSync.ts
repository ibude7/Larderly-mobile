import { useNetworkStatus } from './useNetworkStatus';

export function useNetworkSync(): void {
  useNetworkStatus();
}
