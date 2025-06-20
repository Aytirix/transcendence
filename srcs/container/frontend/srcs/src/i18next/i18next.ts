import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const missingKeys = new Set();

i18n
	.use(HttpBackend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		lng: localStorage.getItem('language') || 'fr',
		fallbackLng: 'fr',
		debug: false,
		interpolation: {
			escapeValue: false,
		},
		backend: {
			loadPath: '/locales/{{lng}}/translation_frontend.json',
		},
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
		},
		returnNull: false,
		returnEmptyString: false,
		parseMissingKeyHandler: (key: string) => {
			if (missingKeys.has(key)) return key;
			missingKeys.add(key);
			const lang = i18n.language;
			console.error(`🔑 Clé manquante dans [${lang}]: ${key}`);
			return key;
		},
	});

export default i18n;
