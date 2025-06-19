import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageToggle from './components/LanguageToggle';

const IronManNavBar: React.FC = () => {
	const { t } = useLanguage();
	const [logoMenuOpen, setLogoMenuOpen] = useState(false);
	const navigate = useNavigate();
	const logoMenuRef = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const user = useAuth();
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

	const hideOnPaths = ['/Pacman', '/login', '/register', '/auth/checkCode'];
	const loadNavBar = !hideOnPaths.includes(location.pathname) && !location.pathname.startsWith('/Pong');

  return (
    <>
      {loadNavBar && (
        <div className="navbar bg-base-300 shadow-sm">
          <div className="navbar-start">
            <div role="button" className="btn btn-ghost btn-circle avatar" onClick={async () => {navigate('/'); }}>
              <div className=" rounded-full">
                <img
                  alt="logo"
                  src="avatars/ironman.svg" />
              </div>
            </div>
          </div>
           <div className="navbar-center">
             <Link to="/Pacman" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl" >Pacman</Link>
             <Link to="/Pong" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">Pong</Link>
            <Link to="/Chat" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">Chat</Link>
            <Link to="/friend" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">Ami</Link>
            <Link to="/credits" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">Crédits</Link>
           </div>
          <div className="navbar-end">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  <img
                    alt="Avatar"
                    src={ApiService.getFile(user.user?.avatar)} />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-300 rounded-box z-1 mt-3 w-30 p-2 shadow">
                <li>
                  <a className="justify-between" onClick={() => navigate('/profile')}>{t('profile')}</a>
                </li>
                <li><a onClick={async () => {
                     await ApiService.get('/logout');
                     navigate('/login');
                   }}>{t('logout')}</a></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IronManNavBar;