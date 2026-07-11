import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { usePrefs } from '../contexts/PreferencesContext';
import type { Language } from '../contexts/preferencesSchema';
import { translate, type TranslationParams } from './core';

export { interpolateTranslation, translate } from './core';
export type { TranslationParams } from './core';

interface LocaleContextValue {
  locale: Language;
  t: (key: string, params?: TranslationParams) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs();
  const locale = prefs.language;
  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n must be used within LocaleProvider');
  return context;
}
