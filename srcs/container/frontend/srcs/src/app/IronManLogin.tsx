import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import React, { useState } from 'react';
import ApiService from '../api/ApiService';
import './assets/styles/IronManTheme.css';
import { useNavigate } from 'react-router-dom';
// import { User } from '../app/types/userTypes';

interface LoginSchema {
  email: string;
  password: string;
}

const IronManLogin: React.FC = () => {
  const [form, setForm] = useState<LoginSchema>({ email: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("test0");
      const resp = await ApiService.post('/login', form) as ApiService;
      console.log("test1");
      console.log(resp.ok);
      if (!resp.ok) {
        console.log("test2");
        console.log(resp.ok);
        const data = await resp.json();
        setError(data.message || 'Erreur lors de la connexion.');
      } else {
        navigate('/');
      }
      
      console.log("test4");
    } catch (err) {
      setError('Erreur réseau ou serveur.');
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
        <h2 className="ironman-title">Connexion</h2>
        <input
          className="ironman-input"
          name="email"
          placeholder="E-mail"
          value={form.email}
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
        <button className="ironman-btn" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <a href="http://localhost:3000/auth/google">
          <img src="https://developers.google.com/identity/images/btn_google_signin_dark_normal_web.png" alt="Sign in with Google" />
        </a>
        {error && <div style={{ color: '#c20000', marginTop: '16px', textAlign: 'center' }}>{error}</div>}
        <span className="ironman-switch-link">
          <Link to="/register">Nouveau héros ? Créer un compte</Link>
        </span>
      </form>
    </div>
  );
};

export default IronManLogin;
