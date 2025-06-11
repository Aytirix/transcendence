import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import React, { useState } from 'react';
// import './assets/styles/IronManTheme.css';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from './components/GoogleLoginButton';

interface RegisterSchema {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  lang: string;
}

const IronManRegister: React.FC = () => {
  const [form, setForm] = useState<RegisterSchema>({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    lang: 'fr',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas !");
      return;
    }
    setLoading(true);
    // const {...toSend } = form;

    try {
      console.log("form",form);
      const resp = await ApiService.post('/register', form) as ApiService;

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.message || 'Erreur lors de la création du compte.');
      } else {
        setSuccess("Compte créé avec succès ! Bienvenue dans l'équipe Iron Man.");
        navigate('/');
      }
    } catch (err: any) {
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div className="min-h-screen flex items-center justify-center">
    
          <form className=" " onSubmit={handleSubmit}>
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend">Register</legend>
        <input
          className="input input-a"
          type="email"
          name="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="input input-a"
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          className="input input-a"
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          className="input input-a"
          type="password"
          name="confirmPassword"
          placeholder="Confirmez le mot de passe"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <select
          className="input input-a"
          name="lang"
          value={form.lang}
          onChange={handleChange}
          required
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="it">Italia</option>
        </select>
        <button className="btn btn-neutral mt-4" type="submit">
          Créer mon compte
        </button>
          <GoogleLoginButton textbtn="signup"/>
          <Link to="/login">Déjà membre ? Se connecter</Link>
            </fieldset>
          </form>
        </div>
        </>
  );
};

export default IronManRegister;
