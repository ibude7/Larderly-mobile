import { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingScannedItem {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
  barcode: string;
}

interface OnboardingSessionContextType {
  scannedItem: OnboardingScannedItem | null;
  setScannedItem: (item: OnboardingScannedItem | null) => void;
  scanSkipped: boolean;
  setScanSkipped: (v: boolean) => void;
  addedToSync: boolean;
  setAddedToSync: (v: boolean) => void;
}

const OnboardingSessionContext = createContext<OnboardingSessionContextType | undefined>(
  undefined,
);

export function OnboardingSessionProvider({ children }: { children: ReactNode }) {
  const [scannedItem, setScannedItem] = useState<OnboardingScannedItem | null>(null);
  const [scanSkipped, setScanSkipped] = useState(false);
  const [addedToSync, setAddedToSync] = useState(false);

  return (
    <OnboardingSessionContext.Provider
      value={{
        scannedItem,
        setScannedItem,
        scanSkipped,
        setScanSkipped,
        addedToSync,
        setAddedToSync,
      }}
    >
      {children}
    </OnboardingSessionContext.Provider>
  );
}

export function useOnboardingSession() {
  const ctx = useContext(OnboardingSessionContext);
  if (!ctx) {
    throw new Error('useOnboardingSession must be used within OnboardingSessionProvider');
  }
  return ctx;
}
