'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Locale = 'en' | 'es';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const translations: Record<Locale, any> = { en, es };

export const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [storedLocale, setStoredLocale] = useLocalStorage<Locale>('locale', 'en');
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setIsClient(true);
    setLocale(storedLocale);
  }, []);

  useEffect(() => {
    if (isClient) {
      setLocale(storedLocale);
    }
  }, [storedLocale, isClient]);

  const handleSetLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale);
    setLocale(newLocale);
  };
  
  const t = useCallback((key: string): string => {
      const keys = key.split('.');
      let result = translations[locale];
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
          // Fallback to English if translation not found
          let fallbackResult = translations['en'];
          for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
          }
          return fallbackResult || key;
        }
      }
      return result || key;
    },
    [locale]
  );

  if (!isClient) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
