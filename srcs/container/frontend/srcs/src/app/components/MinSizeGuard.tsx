import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/MinSizeGuard.scss';

interface MinSizeGuardProps {
	children: ReactNode;
	minWidth?: number;
	minHeight?: number;
	message?: string;
	className?: string;
	hideWhenBlocked?: boolean;
}

const MinSizeGuard = ({
	children,
	minWidth = 768,
	minHeight = 600,
	message = '',
	className = '',
	hideWhenBlocked = false
}: MinSizeGuardProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [windowSize, setWindowSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	});

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleGoHome = () => {
		navigate('/', { replace: true });
	};

	const isBlocked = windowSize.width < minWidth || windowSize.height < minHeight;

	if (isBlocked) {
		// Si hideWhenBlocked est true, ne rien afficher du tout
		if (hideWhenBlocked) {
			return null;
		}

		// Sinon, afficher l'écran de blocage habituel
		return (
			<div className={`min-size-guard ${className}`}>
				<button 
					className="min-size-guard-home-btn"
					onClick={handleGoHome}
					title={t('minSizeGuard.goHome', 'Retour à l\'accueil')}
				>
					<img src="/avatars/ironman.svg" alt="Iron Man home icon" />
					<span className="home-label">{t('minSizeGuard.goHome', 'Accueil')}</span>
				</button>
				<div className="min-size-guard-content">
					<div className="min-size-guard-icon">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
							<line x1="8" y1="21" x2="16" y2="21" />
							<line x1="12" y1="17" x2="12" y2="21" />
						</svg>
					</div>
					<h2 className="min-size-guard-title">
						{t('minSizeGuard.title')}
					</h2>
					<p className="min-size-guard-message">
						{message || t('minSizeGuard.defaultMessage')}
					</p>
					<div className="min-size-guard-details">
						<p>
							{t('minSizeGuard.currentSize')}: {windowSize.width}x{windowSize.height}
						</p>
						<p>
							{t('minSizeGuard.requiredSize')}: {minWidth}x{minHeight}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};

export default MinSizeGuard;
