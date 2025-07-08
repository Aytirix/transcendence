import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ApiService from '../api/ApiService';

interface LanguageContextType {
	t: (key: string, options?: Record<string, string | number>) => string;
	setLanguage: (lang: string, updateBackend?: boolean) => void;
	currentLanguage: string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: any) => {
	const { t, i18n } = useTranslation();
	const [currentLanguage, setCurrentLanguage] = useState(() => {
		// Charger la langue depuis le localStorage au démarrage
		const savedLanguage = localStorage.getItem('i18nextLng');
		return savedLanguage || i18n.language || 'fr';
	});

	const setLanguage = async (lang: string, updateBackend: boolean = true) => {
		i18n.changeLanguage(lang);
		setCurrentLanguage(lang);

		// Envoyer au backend si l'utilisateur est connecté et updateBackend est true
		if (updateBackend) {
			try {
				// Vérifier d'abord si l'utilisateur est connecté
				const authResponse = await ApiService.get('/isAuth');
				if (authResponse.isAuthenticated) {
					// Mettre à jour la langue sur le serveur via update-user
					await ApiService.put('/update-user', { lang }, false);
					console.log('🌐 Language updated on server:', lang);
				}
			} catch (error) {
				console.error('❌ Failed to update language on server:', error);
				// Ne pas bloquer l'interface si l'update backend échoue
			}
		}
	};

	// Initialiser la langue depuis le localStorage au premier chargement
	useEffect(() => {
		const savedLanguage = localStorage.getItem('i18nextLng');
		if (savedLanguage && savedLanguage !== i18n.language) {
			i18n.changeLanguage(savedLanguage);
			setCurrentLanguage(savedLanguage);
		}
	}, [i18n]);

	// Synchroniser avec les changements d'i18n
	useEffect(() => {
		const handleLanguageChange = (lng: string) => {
			setCurrentLanguage(lng);
		};

		i18n.on('languageChanged', handleLanguageChange);

		return () => {
			i18n.off('languageChanged', handleLanguageChange);
		};
	}, [i18n]);

	return (
		<LanguageContext.Provider value={{ t, setLanguage, currentLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
