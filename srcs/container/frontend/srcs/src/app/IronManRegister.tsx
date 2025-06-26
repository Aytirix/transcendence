import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import GoogleLoginButton from './components/GoogleLoginButton';
import LanguageToggle from './components/LanguageToggle';

interface RegisterSchema {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  lang: string;
}

const IronManRegister: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [form, setForm] = useState<RegisterSchema>({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    lang: currentLanguage,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Synchroniser la langue du formulaire avec le changement de langue global
  useEffect(() => {
    setForm(prev => ({ ...prev, lang: currentLanguage }));
  }, [currentLanguage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas !");
      return;
    }
    setLoading(true);

    try {
      console.log("form", form);
      const resp: any = await ApiService.post('/register', form) as ApiService;

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.message || 'Erreur lors de la création du compte.');
      } else {
        setSuccess("Merci de vérifier votre email pour activer votre compte.");
      }
    } catch (err: any) {
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Bouton de changement de langue en haut à droite */}
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>

        <form className=" " onSubmit={handleSubmit}>
          <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
            <legend className="fieldset-legend text-lg">{t('register.title')}</legend>
            
            <input
              className="input input-a"
              type="email"
              name="email"
			  maxLength={50}
              placeholder={t('register.email')}
              value={form.email}
              onChange={handleChange}
              required
            />
            
            <input
              className="input input-a"
              type="text"
              name="username"
              maxLength={15}
              placeholder={t('register.username')}
              value={form.username}
              onChange={handleChange}
              required
            />
            
            <input
              className="input input-a"
              type="password"
              name="password"
              placeholder={t('register.password')}
              value={form.password}
              onChange={handleChange}
              required
            />
            
            <input
              className="input input-a"
              type="password"
              name="confirmPassword"
              placeholder={t('register.confirmPassword')}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            
            <button className="btn btn-neutral mt-4 text-black" type="submit" disabled={loading}>
              {loading ? "Création..." : t('register.submit')}
            </button>
            
            <div className="flex justify-center mt-4">
              <GoogleLoginButton textbtn="signup"/>
            </div>
            
            <Link to="/login">{t('register.loginLink')}</Link>
            
            {error && <div style={{ color: '#c20000', marginTop: '16px', textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: '#28a745', marginTop: '16px', textAlign: 'center' }}>{success}</div>}
          </fieldset>
        </form>
      </div>
    </>
  );
};

export default IronManRegister;
