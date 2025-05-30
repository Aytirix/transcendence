import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../api/ApiService';
import './assets/styles/IronManNavBar.css';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
];

interface Props {
  language: string;
  onLanguageChange: (lang: string) => void;
}

const IronManNavBar: React.FC<Props> = ({ language, onLanguageChange }) => {
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <nav className="ironman-navbar">
      <div className="ironman-navbar-logo">
        {/* Petite tête ou logo IronMan */}
        <svg width="36" height="36" viewBox="0 0 54 54">
          <ellipse cx="27" cy="27" rx="25" ry="25" fill="#c20000" stroke="#ffd700" strokeWidth="2"/>
          <rect x="15" y="20" width="24" height="18" rx="6" fill="#ffd700"/>
          <rect x="21" y="31" width="3" height="7" rx="1.5" fill="#c20000"/>
          <rect x="30" y="31" width="3" height="7" rx="1.5" fill="#c20000"/>
          <rect x="21" y="24" width="12" height="3" fill="#222"/>
        </svg>
        <span className="ironman-navbar-title">IRON MAN HUB</span>
      </div>
      <div className="ironman-navbar-links">
        <Link to="/Pacman">Pacman</Link>
        <Link to="/WebSocketTest">userTest</Link>
        <Link to="/Pong">pong tests</Link>
        <Link to="/ModuleManager">Module Manager</Link>
      </div>
      <div className="ironman-navbar-logout" onClick={() => { ApiService.get('/logout') as ApiService; navigate('/login');}}>
        <span>Logout</span>
      </div>
      <div className="ironman-navbar-lang">
        <div
          className="ironman-lang-select"
          onClick={() => setLangOpen(o => !o)}
          tabIndex={0}
          onBlur={() => setTimeout(() => setLangOpen(false), 150)}
        >
          <span>
            {LANGUAGES.find(l => l.code === language)?.label || "Langue"}
          </span>
          <span className={`arrow ${langOpen ? 'open' : ''}`}>▼</span>
          {langOpen &&
            <div className="ironman-lang-dropdown">
              {LANGUAGES.map(l => (
                <div
                  key={l.code}
                  className={`ironman-lang-option${l.code === language ? ' selected' : ''}`}
                  onClick={() => { onLanguageChange(l.code); setLangOpen(false); }}
                >
                  {l.label}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </nav>
  );
};

export default IronManNavBar;
