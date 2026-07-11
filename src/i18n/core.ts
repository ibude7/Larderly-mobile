import type { Language } from '../contexts/preferencesSchema';
import {
  EN_CATALOG,
  TRANSLATION_CATALOGS,
  type TranslationCatalog,
} from './catalogs';

export type TranslationParams = Readonly<Record<string, string | number>>;

export function interpolateTranslation(
  template: string,
  params: TranslationParams = {},
): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder,
  );
}

export function translate(
  locale: Language,
  key: string,
  params?: TranslationParams,
  catalogs: Readonly<Partial<Record<Language, TranslationCatalog>>> = TRANSLATION_CATALOGS,
): string {
  const localized = catalogs[locale]?.[key];
  const fallback = catalogs.en?.[key] ?? EN_CATALOG[key];
  return interpolateTranslation(localized ?? fallback ?? key, params);
}
