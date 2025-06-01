import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import React, { useState } from 'react';
import './assets/styles/IronManTheme.css';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

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
    <div className="ironman-container">
      <form className="ironman-card" onSubmit={handleSubmit}>
        <div className="ironman-icon">
          {/* Iron Man SVG Mini-Face */}
          <svg width="54" height="54" viewBox="0 0 54 54">
            <ellipse cx="27" cy="27" rx="25" ry="25" fill="#c20000" stroke="#ffd700" strokeWidth="2"/>
            <rect x="15" y="20" width="24" height="18" rx="6" fill="#ffd700"/>
            <rect x="21" y="31" width="3" height="7" rx="1.5" fill="#c20000"/>
            <rect x="30" y="31" width="3" height="7" rx="1.5" fill="#c20000"/>
            <rect x="21" y="24" width="12" height="3" fill="#222"/>
          </svg>
        </div>
        <h2 className="ironman-title">Rejoindre les Avengers</h2>
        <input
          className="ironman-input"
          type="email"
          name="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="ironman-input"
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          className="ironman-input"
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          className="ironman-input"
          type="password"
          name="confirmPassword"
          placeholder="Confirmez le mot de passe"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <select
          className="ironman-input"
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
        <button className="ironman-btn" type="submit">
          Créer mon compte
        </button>
        {error && <div style={{ color: '#c20000', marginTop: '16px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#52ff52', marginTop: '16px', textAlign: 'center' }}>{success}</div>}
        <span className="ironman-switch-link">
          <Link to="/login">Déjà membre ? Se connecter</Link>
        </span>
      </form>
    </div>
  );
};

export default IronManRegister;
