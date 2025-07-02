import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const LANGUAGES = [
	{ code: 'fr', label: 'Français', flag: '🇫🇷' },
	{ code: 'en', label: 'English', flag: '🇺🇸' },
	{ code: 'es', label: 'Español', flag: '🇪🇸' },
	{ code: 'it', label: 'Italiano', flag: '🇮🇹' },
]

const MOBILE_BREAKPOINT = 810;

interface LanguageToggleProps {
	showLabel?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ showLabel = true }) => {
	const { setLanguage, currentLanguage } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
	);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

	const handleLanguageChange = (langCode: string) => {
		setLanguage(langCode);
		setIsOpen(false);
	};

	// Gérer le mode mobile/desktop dynamiquement
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Fermer le menu quand on clique à l'extérieur (desktop uniquement)
	useEffect(() => {
		if (!isMobile) {
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
		}
	}, [isOpen, isMobile]);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="btn btn-ghost btn-sm gap-1 normal-case"
			>
				<span>{currentLang.flag}</span>
				<span className={isMobile ? 'hidden' : (showLabel ? '' : 'hidden')}>{currentLang.label}</span>
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
				<>
					{/* Menu mobile via portail React */}
					{isMobile && typeof window !== 'undefined' && ReactDOM.createPortal(
						<>
							<div
								className="fixed inset-0 bg-black bg-opacity-40 z-50"
								onClick={() => setIsOpen(false)}
							></div>
							<div
								className="fixed inset-0 flex flex-col items-center justify-center bg-base-200 z-50"
							>
								<button
									className="absolute top-4 right-4 text-3xl text-gray-600 hover:text-gray-900 focus:outline-none"
									onClick={() => setIsOpen(false)}
									aria-label="Fermer le menu des langues"
								>
									&times;
								</button>
								{LANGUAGES.map((lang) => (
									<button
										key={lang.code}
										type="button"
										onClick={() => handleLanguageChange(lang.code)}
										className={`w-11/12 max-w-xs mx-auto mb-3 px-6 py-4 text-xl text-left bg-base-100 rounded-lg shadow hover:bg-base-300 flex items-center gap-4 ${lang.code === currentLanguage ? 'font-bold border-2 border-primary' : ''}`}
										style={{ fontSize: '1.25rem' }}
									>
										<span style={{ fontSize: '2rem' }}>{lang.flag}</span>
										<span>{lang.label}</span>
									</button>
								))}
							</div>
						</>,
						document.body
					)}
					{/* Menu desktop classique */}
					{!isMobile && (
						<div className="absolute top-full left-0 mt-1 bg-base-200 rounded-box shadow-lg border border-base-300 z-50 min-w-full">
							{LANGUAGES.map((lang) => (
								<button
									key={lang.code}
									type="button"
									onClick={() => handleLanguageChange(lang.code)}
									className={`w-full px-4 py-2 text-left hover:bg-base-300 flex items-center gap-2 first:rounded-t-box last:rounded-b-box ${lang.code === currentLanguage ? 'font-bold' : ''}`}
								>
									<span>{lang.flag}</span>
									<span>{lang.label}</span>
								</button>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default LanguageToggle;
