import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LANGUAGES = [
	{ code: 'fr', label: 'Français', flag: '🇫🇷' },
	{ code: 'en', label: 'English', flag: '🇺🇸' },
	{ code: 'es', label: 'Español', flag: '🇪🇸' },
	{ code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

const LanguageToggle: React.FC = () => {
	const { setLanguage, currentLanguage } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

	const handleLanguageChange = (langCode: string) => {
		setLanguage(langCode);
		setIsOpen(false);
	};

	// Fermer le menu quand on clique à l'extérieur
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="btn btn-ghost btn-sm gap-2 normal-case"
			>
				<span>{currentLang.flag}</span>
				<span className="hidden sm:inline">{currentLang.label}</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-1 bg-base-200 rounded-box shadow-lg border border-base-300 z-50 min-w-full">
					{LANGUAGES.map((lang) => (
						<button
							key={lang.code}
							type="button"
							onClick={() => handleLanguageChange(lang.code)}
							className={`w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 first:rounded-t-box last:rounded-b-box ${lang.code === currentLanguage ? 'bg-primary text-primary-content' : ''
								}`}
						>
							<span>{lang.flag}</span>
							<span>{lang.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default LanguageToggle;
