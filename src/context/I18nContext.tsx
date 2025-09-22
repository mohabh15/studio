import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale } from '../types';
import en from '../locales/en.json';
import es from '../locales/es.json';

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const translations: Record<Locale, any> = { en, es };

export const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem('locale');
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
        setLocaleState(savedLocale as Locale);
      }
    } catch (error) {
      console.error('Error loading locale:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLocale = async (newLocale: Locale) => {
    try {
      await AsyncStorage.setItem('locale', newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Error saving locale:', error);
    }
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
  }, [locale]);

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}