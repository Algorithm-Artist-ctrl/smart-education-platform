'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './index';

export type TranslationObject = typeof translations['en'];

export type I18nFunctionAndObject = TranslationObject & ((key: TranslationKey) => string);

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: I18nFunctionAndObject;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('smart_edu_lang') as Language;
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smart_edu_lang', lang);
    if (typeof document !== 'undefined') {
      document.cookie = `smartedu_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const tFunc = (key: TranslationKey): string => {
    return (translations[language] as any)?.[key] || (translations['en'] as any)?.[key] || (key as string);
  };

  const currentTranslations = translations[language] || translations['en'];
  const t = Object.assign(tFunc, currentTranslations) as I18nFunctionAndObject;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
