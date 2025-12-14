import zh from './locales/zh.json';
import en from './locales/en.json';

export const locales = {
  zh,
  en,
} as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof zh;

export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  zh: '🇨🇳',
  en: '🇺🇸',
};

// Helper function to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the path if not found
    }
  }

  return typeof result === 'string' ? result : path;
}

// Get translation function
export function getTranslation(locale: Locale) {
  const translations = locales[locale] || locales[defaultLocale];

  return function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(translations as unknown as Record<string, unknown>, key);

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return value;
  };
}

// Storage key for locale preference
export const LOCALE_STORAGE_KEY = 'lite-blog-locale';
