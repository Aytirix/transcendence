import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
];

const IronManNavBar: React.FC = () => {
  // const { i18n } = useTranslation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuth();
  // Fermer le logo-menu au clic en dehors
  const hideOnPaths = ['/Pacman', '/login', '/register'];
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