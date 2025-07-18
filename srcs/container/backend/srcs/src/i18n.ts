import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

i18next.use(Backend).init({
	fallbackLng: 'fr',
	preload: ['fr', 'en', 'it', 'es'],
	backend: {
		loadPath: __dirname + '/../locales/{{lng}}/translation_backend.json'
	},
	debug: false,
	returnNull: false,
	returnEmptyString: false,
	parseMissingKeyHandler: (key) => {
		console.error(`🔑 i18next : Clé manquante : ${key}`);
		return key;
	}
});

export default i18next;
