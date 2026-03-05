// Initialize i18n synchronously for tests (no async language detector)
const i18n = require('i18next');
const { initReactI18next } = require('react-i18next');
const en = require('./src/i18n/locales/en.json');

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
