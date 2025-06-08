import { useEffect, useRef } from 'react';
import ApiService from '../../api/ApiService';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18next/i18next';

const GOOGLE_CLIENT_ID = '235494829152-rogrpto31jsvp0ml7qp16ncuvge7msmv.apps.googleusercontent.com';

export default function GoogleLoginButton({ textbtn = "login" }) {
	const buttonDiv = useRef<HTMLDivElement>(null);
	const user = useAuth().user;
	useEffect(() => {
		// @ts-ignore
		if (window.google && buttonDiv.current) {
			// @ts-ignore
			window.google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: async (response: any) => {
					// Ici tu obtiens l'id_token JWT
					console.log('Google response', response);
					const json = {
						'jwt': response.credential
					}
					const resp = await ApiService.post('/auth/google/callback', json) as ApiService;
					console.log("RESp", resp);
					let texte: string;
					if (resp?.ok)
						texte = "YES";
					else
						texte = "NO";
				},
			});
			// @ts-ignore
			window.google.accounts.id.renderButton(buttonDiv.current, {
				theme: 'outline',
				size: 'large',
				type: 'standard',
				text: textbtn === 'login' ? 'signin_with' : 'signup_with',
				shape: 'rectangular',
				logo_alignment: 'left',
				width: '100%',
				locale: i18n.language,
			});
		}
	}, []);

	return (<><div ref={buttonDiv}></div></>);
}