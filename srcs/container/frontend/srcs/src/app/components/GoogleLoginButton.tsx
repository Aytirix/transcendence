import { useEffect, useRef } from 'react';
import ApiService from '../../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const GOOGLE_CLIENT_ID = '235494829152-rogrpto31jsvp0ml7qp16ncuvge7msmv.apps.googleusercontent.com';

export default function GoogleLoginButton({textbtn = "login"}) {
  const buttonDiv = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  
  // Initialiser le bouton Google une seule fois
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
          const resp: any = await ApiService.post('/auth/google/callback', json);
          console.log("RESp", resp);
		  if(resp?.isAuthenticated)
        	navigate('/');
        },
      });
      
      renderGoogleButton();
    }
  }, []);
  
  // Fonction pour rendre le bouton Google
  const renderGoogleButton = () => {
    if (buttonDiv.current) {
      // Vider le contenu précédent
      buttonDiv.current.innerHTML = '';
      
      // @ts-ignore
      window.google.accounts.id.renderButton(buttonDiv.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: textbtn === 'login' ? 'signin_with' : 'signup_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
        locale: currentLanguage,
      });
    }
  };
  
  // Mettre à jour seulement la langue quand elle change
  useEffect(() => {
    // @ts-ignore
    if (window.google && buttonDiv.current) {
      renderGoogleButton();
    }
  }, [currentLanguage, textbtn]);

  return (<div ref={buttonDiv}></div>);
}