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
				// <nav className="ironman-navbar">
				//   <div className="ironman-navbar-logo" ref={logoMenuRef}>
				//     {/* Logo IronMan clic = menu déroulant */}
				//     <div
				//       className="ironman-navbar-logo-btn"
				//       onClick={() => setLogoMenuOpen(o => !o)}
				//       tabIndex={0}
				//       role="button"
				//       aria-haspopup="menu"
				//       aria-expanded={logoMenuOpen}
				//     >
				//       <svg width="36" height="36" viewBox="0 0 54 54">
				//         <ellipse cx="27" cy="27" rx="25" ry="25" fill="#c20000" stroke="#ffd700" strokeWidth="2" />
				//         <rect x="15" y="20" width="24" height="18" rx="6" fill="#ffd700" />
				//         <rect x="21" y="31" width="3" height="7" rx="1.5" fill="#c20000" />
				//         <rect x="30" y="31" width="3" height="7" rx="1.5" fill="#c20000" />
				//         <rect x="21" y="24" width="12" height="3" fill="#222" />
				//       </svg>
				//       <span className="ironman-navbar-title">IRON MAN HUB</span>
				//     </div>
				//     {logoMenuOpen && (
				//       <div className="ironman-logo-dropdown">
				//         <Link to="/" onClick={() => setLogoMenuOpen(false)}>Accueil</Link>
				//         <Link to="/Profile" onClick={() => setLogoMenuOpen(false)}>{t('profile')}</Link>
				//         <button
				//           className="ironman-logout-btn"
				//           onClick={async () => {
				//             setLogoMenuOpen(false);
				//             await ApiService.get('/logout');
				//             navigate('/login');
				//           }}
				//         >
				//           {t('logout')}
				//         </button>
				//       </div>
				//     )}
				//   </div>
				//   <div className="ironman-navbar-links">
				//     <Link to="/Pacman">Pacman</Link>|
				//     <Link to="/Pong">Pong</Link>|
				//     <Link to="/Chat">Chat</Link>
				//   </div>
				//   <div className="ironman-navbar-lang">
				//     <div
				//       className="ironman-lang-select"
				//       onClick={() => setLangOpen(o => !o)}
				//       tabIndex={0}
				//       onBlur={() => setTimeout(() => setLangOpen(false), 150)}
				//     >
				//       <span>
				//         {LANGUAGES.find(l => l.code === i18n.language)?.label || 'Langue'}
				//       </span>
				//       <span className={`arrow ${langOpen ? 'open' : ''}`}>▼</span>
				//       {langOpen && (
				//         <div className="ironman-lang-dropdown">
				//           {LANGUAGES.map(l => (
				//             <div
				//               key={l.code}
				//               className={`ironman-lang-option${l.code === i18n.language ? ' selected' : ''}`}
				//               onClick={() => {
				//                 i18n.changeLanguage(l.code);
				//                 setLangOpen(false);
				//               }}
				//             >
				//               {l.label}
				//             </div>
				//           ))}
				//         </div>
				//       )}
				//     </div>
				//   </div>
				// </nav>
				<div className="navbar bg-base-300 shadow-sm">
					<div className="navbar-start">
						<div role="button" className="btn btn-ghost btn-circle avatar" onClick={async () => { navigate('/'); }}>
							<div className=" rounded-full">
								<img
									alt="logo"
									src="avatars/ironman.svg" />
							</div>
						</div>
					</div>
					<div className="navbar-center">
						<Link to="/Pacman" className="btn btn-ghost text-xl" >Pacman</Link>
						<Link to="/Pong" className="btn btn-ghost text-xl">Pong</Link>
						<Link to="/Chat" className="btn btn-ghost text-xl">Chat</Link>
					</div>
					<div className="navbar-end">
						{/* Bouton de changement de langue */}
						<LanguageToggle />
						
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
								<li><a>Settings</a></li>
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