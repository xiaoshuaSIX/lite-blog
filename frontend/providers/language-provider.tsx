"use client";

import * as React from "react";
import {
  Locale,
  defaultLocale,
  getTranslation,
  LOCALE_STORAGE_KEY,
  locales,
} from "@/lib/i18n";

type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>
) => string;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFunction;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(defaultLocale);
  const [mounted, setMounted] = React.useState(false);

  // Load locale from localStorage on mount
  React.useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (savedLocale && savedLocale in locales) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  // Update localStorage and html lang when locale changes
  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = React.useMemo(() => getTranslation(locale), [locale]);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Hook for just the translation function
export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
