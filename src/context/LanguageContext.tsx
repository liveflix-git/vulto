import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Locale,
  TranslationDictionary,
  LocalizedService,
  LocalizedMetric,
  LocalizedProcessStep,
  LocalizedCorePillar,
  LocalizedAboutConcept,
  LocalizedChatOption,
  LocalizedDirectContact,
  LocalizedNfcFeature,
} from '../i18n/types';
import { getDictionary, tKey } from '../i18n';

interface LanguageContextType {
  language: Locale;
  setLanguage: (locale: Locale) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
  dict: TranslationDictionary;
  services: LocalizedService[];
  metrics: LocalizedMetric[];
  processSteps: LocalizedProcessStep[];
  pillars: LocalizedCorePillar[];
  concepts: LocalizedAboutConcept[];
  chatOptions: LocalizedChatOption[];
  directContacts: LocalizedDirectContact[];
  nfcFeatures: LocalizedNfcFeature[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'vulto_locale';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'pt-BR';
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'pt-PT' ? 'pt-PT' : 'pt-BR';
  });

  const setLanguage = useCallback((newLocale: Locale) => {
    setLanguageState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // LocalStorage might fail in restricted iframe environments
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const dict = useMemo(() => getDictionary(language), [language]);

  const t = useCallback(
    (path: string, fallback?: string) => {
      return tKey(path, language, fallback);
    },
    [language]
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      locale: language,
      setLocale: setLanguage,
      t,
      dict,
      services: dict.servicesData,
      metrics: dict.metricsBar.items,
      processSteps: dict.process.steps,
      pillars: dict.whatWeDo.pillars,
      concepts: dict.aboutSection.concepts,
      chatOptions: dict.vultoChat.options,
      directContacts: dict.contactSection.directContacts,
      nfcFeatures: dict.nfcSection.features,
    }),
    [language, setLanguage, t, dict]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, dict, language } = useLanguage();
  return { t, dict, language };
}
