import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface AuthFlowDraft {
  fullName: string;
  email: string;
}

interface AuthFlowContextValue extends AuthFlowDraft {
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  resetDraft: () => void;
}

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const value = useMemo(
    () => ({
      fullName,
      email,
      setFullName,
      setEmail,
      resetDraft: () => {
        setFullName('');
        setEmail('');
      },
    }),
    [email, fullName],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const value = useContext(AuthFlowContext);
  if (!value) {
    throw new Error('useAuthFlow must be used inside AuthFlowProvider');
  }
  return value;
}
