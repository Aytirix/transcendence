import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getMinecraftInfo } from './minecraft/FullscreenMinecraftHandler.tsx';
import './assets/styles/intro.scss';
import { useAuth } from '../contexts/AuthContext.tsx';
import { canAccessMinecraft, recordMinecraftAccess } from './minecraft/minecraftUtils';

function Intro() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [currentTime, setCurrentTime] = useState(new Date());
	const { user, loading } = useAuth();

	useEffect(() => {
		if (!user || loading) {
			return;
		}
		const check = localStorage.getItem('getMinecraftInfo?');
		if (check === 'false' || check === null) {
			getMinecraftInfo();
			localStorage.setItem('getMinecraftInfo?', 'true');
		}
	}, [user, loading]);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const navigateToGame = (game: string) => {
		navigate(`/${game}`);
	};

	return (
			<div className="intro-container">
				{/* Hero Section */}
				<section className="hero-section">
					<div className="hero-background"></div>

					{/* Éléments flottants simplifiés */}
					<div className="floating-elements">
						<div className="floating-element floating-element-1">🎮</div>
						<div className="floating-element floating-element-2">🏆</div>
						<div
							className="floating-element floating-element-3"
							onClick={() => navigate('/Pacman')}
							style={{ cursor: 'pointer' }}
						>
							<img
								src="./images/intro/floating-blinky.png"
								alt="Blinky Logo"
								style={{ width: '40px', height: '40px' }}
							/>
						</div>
						<div className="floating-element floating-element-4">💫</div>
						<div
							className="floating-element floating-element-5"
							onClick={() => {
								if (!canAccessMinecraft()) return;
								recordMinecraftAccess();
								navigate('/minecraft');
							}}
							style={{ cursor: 'pointer' }}
						>
							<img
								src="./images/intro/floating-minecraft.png"
								alt="Minecraft Logo"
								style={{ width: '32px', height: '32px' }}
							/>
						</div>
						<div
							className="floating-element floating-element-6"
							onClick={() => navigate('/pong/menu')}
							style={{ cursor: 'pointer' }}
						>
							<img
								src="./images/intro/floating-pong.png"
								alt="Pong Logo"
								style={{ width: '40px', height: '40px' }}
							/>
						</div>

					</div>

					<div className="hero-content">
						<h1 className="hero-title">
							<span className="gradient-text">TRANSCENDENCE</span>
						</h1>
					</div>
				</section>

				{/* Games Section */}
				<section className="games-section">
					<div className="section-decorations">
						<div className="decoration-line decoration-line-left"></div>
						<div className="decoration-line decoration-line-right"></div>
					</div>
					<h2 className="section-title">{t('home.choose_your_adventure')}</h2>
					<div className="games-grid">
						<div
							className="game-card pong-card"
							onClick={() => navigateToGame('pong')}
						>
							<div className="game-icon">🏓</div>
							<h3 className="game-title">IRON PONG</h3>
							<p className="game-description">{t('home.classic_pong_description')}</p>
							<div className="game-features">
								<span className="feature">• {t('home.pong.multiplayer')}</span>
								<span className="feature">• {t('home.real_time')}</span>
								<span className="feature">• {t('home.competitive')}</span>
							</div>
							<button className="play-button">
								{t('home.play_now')} →
							</button>
						</div>

						<div
							className="game-card pacman-card"
							onClick={() => navigateToGame('pacman')}
						>
							<div className="game-icon">👻</div>
							<h3 className="game-title">PAC-MAN</h3>
							<p className="game-description">{t('home.classic_pacman_description')}</p>
							<div className="game-features">
								<span className="feature">• {t('home.retro_arcade')}</span>
								<span className="feature">• {t('home.high_scores')}</span>
								<span className="feature">• {t('home.nostalgic')}</span>
							</div>
							<button className="play-button">
								{t('home.play_now')} →
							</button>
						</div>
					</div>
				</section>

				{/* Footer */}
				<footer className="intro-footer">
					<div className="footer-content">
						<p>
							{t('home.made_with')} ❤️ {t('home.at_42_school')} |
							<span className="current-time">
								{currentTime.toLocaleTimeString()}
							</span>
						</p>
					</div>
				</footer>
			</div>
	);
}

export default Intro;