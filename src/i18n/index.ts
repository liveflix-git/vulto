import { Locale, TranslationDictionary } from './types';
import { ptBR } from './ptBR';
import { ptPT } from './ptPT';

export * from './types';
export { ptBR, ptPT };

export const dictionaries: Record<Locale, TranslationDictionary> = {
  'pt-BR': ptBR,
  'pt-PT': ptPT,
};

export function getDictionary(locale: Locale): TranslationDictionary {
  return dictionaries[locale] || ptBR;
}

/**
 * Helper to safely resolve nested translation string by dot path.
 * e.g. tKey('header.ctaTalk', 'pt-BR')
 */
export function tKey(path: string, locale: Locale, fallback?: string): string {
  const dict = getDictionary(locale);
  const parts = path.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback || path;
    }
  }
  return typeof current === 'string' ? current : fallback || path;
}
