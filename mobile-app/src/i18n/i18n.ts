import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const LANGUAGE_KEY = 'app_language';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Fran\u00e7ais' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espa\u00f1ol' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(stored || 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // silent
    }
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
        es: { translation: es },
      },
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export async function changeLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
}

export function getCurrentLanguage(): string {
  return i18n.language || 'en';
}

export default i18n;
