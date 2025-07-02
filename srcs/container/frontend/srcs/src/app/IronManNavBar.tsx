import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MinSizeGuard from './components/MinSizeGuard';
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

	const hideOnPaths = ['/Pacman', '/login', '/register', '/forget-password', '/auth/checkCode', '/minecraft'];
	const loadNavBar = !hideOnPaths.includes(location.pathname) && !location.pathname.startsWith('/pong');

	return (
		<>
			{loadNavBar && (
				<div className="navbar absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-300/70">
					<div className="navbar-start ml-2">
						<div role="button" className="btn btn-ghost btn-circle avatar" onClick={async () => { navigate('/'); }}>
							<div className="rounded-full">
								<img
									alt="logo"
									src="avatars/ironman.svg" />
							</div>
						</div>
					</div>
					<div className="navbar-center">
						<MinSizeGuard minWidth={1200} minHeight={870} hideWhenBlocked={true}>
							<Link to="/Pacman" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('nav.pacman')}</Link>
						</MinSizeGuard>
						<MinSizeGuard minWidth={1200} minHeight={870} hideWhenBlocked={true}>
							<Link to="/pong" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('nav.pong')}</Link>
						</MinSizeGuard>
						<Link to="/Chat" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('nav.chat')}</Link>
						<Link to="/friend" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('nav.friends')}</Link>
						<Link to="/credits" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('project_credits')}</Link>
						<MinSizeGuard minWidth={400} minHeight={400} hideWhenBlocked={true}>
							<Link to="/module-manager" className="btn btn-ghost sm:text-lg md:text-xl lg:text-2xl">{t('nav.modules')}</Link>
						</MinSizeGuard>
					</div>
					<div className="navbar-end mr-2">
						<MinSizeGuard minWidth={500} minHeight={0} hideWhenBlocked={true}>
							<div className="mr-1">
								<LanguageToggle showLabel={false} />
							</div>
						</MinSizeGuard>
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
								className="menu menu-sm dropdown-content bg-base-300 rounded-box z-[60] mt-3 w-30 p-2 shadow">
								<li>
									<a className="justify-between" onClick={() => { navigate('/profile'); (document.activeElement as HTMLElement)?.blur(); }}>{t('profile.title')}</a>
								</li>
								<li><a onClick={async () => {
									await ApiService.get('/logout');
									navigate('/login');
								}}>{t('logout')}</a></li>
							</ul>
						</div>
					</div>
				</div >
			)}
		</>
	);
};

export default IronManNavBar;