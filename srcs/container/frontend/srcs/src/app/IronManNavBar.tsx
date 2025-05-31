import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import './assets/styles/IronManNavBar.css';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
];

const IronManNavBar: React.FC = () => {
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const navigate = useNavigate();
  const logoMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le logo-menu au clic en dehors
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setLogoMenuOpen(false);
      }
    }
    if (logoMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [logoMenuOpen]);

  return (
    <nav className="ironman-navbar">
      <div className="ironman-navbar-logo" ref={logoMenuRef}>
        {/* Logo IronMan clic = menu déroulant */}
        <div
          className="ironman-navbar-logo-btn"
          onClick={() => setLogoMenuOpen(o => !o)}
          tabIndex={0}
          role="button"
          aria-haspopup="menu"
          aria-expanded={logoMenuOpen}
        >
          <svg width="36" height="36" viewBox="0 0 54 54">
            <ellipse cx="27" cy="27" rx="25" ry="25" fill="#c20000" stroke="#ffd700" strokeWidth="2" />
            <rect x="15" y="20" width="24" height="18" rx="6" fill="#ffd700" />
            <rect x="21" y="31" width="3" height="7" rx="1.5" fill="#c20000" />
            <rect x="30" y="31" width="3" height="7" rx="1.5" fill="#c20000" />
            <rect x="21" y="24" width="12" height="3" fill="#222" />
          </svg>
          <span className="ironman-navbar-title">IRON MAN HUB</span>
        </div>
        {logoMenuOpen && (
          <div className="ironman-logo-dropdown">
            <Link to="/" onClick={() => setLogoMenuOpen(false)}>Accueil</Link>
            <Link to="/Profile" onClick={() => setLogoMenuOpen(false)}>Profile</Link>
            <button
              className="ironman-logout-btn"
              onClick={async () => {
                setLogoMenuOpen(false);
                await ApiService.get('/logout');
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div className="ironman-navbar-links">
        <Link to="/Pacman">Pacman</Link>
        <Link to="/Pong">pong tests</Link>
        <Link to="/Chat">Chat</Link>
      </div>
      <div className="ironman-navbar-lang">
        <div
          className="ironman-lang-select"
          onClick={() => setLangOpen(o => !o)}
          tabIndex={0}
          onBlur={() => setTimeout(() => setLangOpen(false), 150)}
        >
          <span>
            {LANGUAGES.find(l => l.code === i18n.language)?.label || 'Langue'}
          </span>
          <span className={`arrow ${langOpen ? 'open' : ''}`}>▼</span>
          {langOpen && (
            <div className="ironman-lang-dropdown">
              {LANGUAGES.map(l => (
                <div
                  key={l.code}
                  className={`ironman-lang-option${l.code === i18n.language ? ' selected' : ''}`}
                  onClick={() => {
                    i18n.changeLanguage(l.code);
                    setLangOpen(false);
                  }}
                >
                  {l.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default IronManNavBar;
