import { useEffect, useRef } from 'react';
import ApiService from '../../api/ApiService';
import { useNavigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = '235494829152-rogrpto31jsvp0ml7qp16ncuvge7msmv.apps.googleusercontent.com';

export default function GoogleLoginButton() {
  const buttonDiv = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (window.google && buttonDiv.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          const json = {
            'jwt': response.credential
          }
          const resp = await ApiService.post('/auth/google/callback', json) as ApiService;
          if(resp?.isAuthenticated)
            navigate('/');
        },
      });
      window.google.accounts.id.renderButton(buttonDiv.current, {
        theme: 'outline',
        size: 'large',
      });
    }
  }, []);

  return (<div ref={buttonDiv}></div>);
}