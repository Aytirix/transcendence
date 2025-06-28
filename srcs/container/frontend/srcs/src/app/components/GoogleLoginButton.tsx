import { useEffect, useRef, useState } from 'react';
import ApiService from '../../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const GOOGLE_CLIENT_ID = '834516330904-orrkp9jgjbfv9vsao2tr7qlkqgl39oas.apps.googleusercontent.com';

export default function GoogleLoginButton({ textbtn = "login" }) {
	const buttonDiv = useRef<HTMLDivElement>(null);
	const fakeBtn = useRef<HTMLButtonElement>(null);
	const navigate = useNavigate();
	const { t, currentLanguage } = useLanguage();
	const [btnSize, setBtnSize] = useState({ width: 255, height: 40 });

	// Initialiser le bouton Google une seule fois
	useEffect(() => {
		// @ts-ignore
		if (window.google && buttonDiv.current) {
			// @ts-ignore
			window.google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: async (response: any) => {
					const json = { 'jwt': response.credential };
					const resp: any = await ApiService.post('/auth/google/callback', json);
					if (resp?.isAuthenticated) navigate('/');
				},
				auto_select: false,
			});
			renderGoogleButton();
		}
	}, []);

	const renderGoogleButton = () => {
		if (buttonDiv.current) {
			buttonDiv.current.innerHTML = '';
			// @ts-ignore
			window.google.accounts.id.renderButton(buttonDiv.current, {
				theme: 'outline',
				size: 'large',
				type: 'standard',
				text: textbtn === 'login' ? 'signin_with' : 'signup_with',
				shape: 'rectangular',
				logo_alignment: 'left',
				width: btnSize.width,
				locale: currentLanguage,
			});
			buttonDiv.current.style.opacity = '0';
			// Récupère la taille réelle du bouton Google après rendu
			setTimeout(() => {
				const realBtn = buttonDiv.current?.querySelector('div[role="button"]');
				if (realBtn) {
					const rect = (realBtn as HTMLElement).getBoundingClientRect();
					setBtnSize({ width: rect.width, height: rect.height });
				}
			}, 100);
		}
	};

	useEffect(() => {
		// @ts-ignore
		if (window.google && buttonDiv.current) {
			renderGoogleButton();
		}
	}, [currentLanguage, textbtn]);

	const handleFakeClick = () => {
		const realBtn = buttonDiv.current?.querySelector('div[role="button"]');
		if (realBtn) {
			(realBtn as HTMLElement).click();
		}
	};

	return (
		<div style={{ position: 'relative', width: btnSize.width, minHeight: btnSize.height, overflow: 'visible' }}>
			<div ref={buttonDiv} style={{ position: 'absolute', top: 0, left: 0, width: btnSize.width, height: btnSize.height }} />
			<button
				ref={fakeBtn}
				type="button"
				onClick={handleFakeClick}
				className="btn btn-neutral text-black font-bold bg-gradient-to-r  transition-colors w-full rounded-md shadow-lg flex items-center justify-center gap-2"
				style={{ minHeight: btnSize.height, width: (btnSize.width + 10), padding: '20px 10px' }}
			>
				<img src="/images/iconGoogle.webp" alt="Google" style={{ width: 24, height: 24 }} />
				{t(textbtn === 'login' ? 'login.withGoogle' : 'register.withGoogle')}
			</button>
		</div>
	);
}