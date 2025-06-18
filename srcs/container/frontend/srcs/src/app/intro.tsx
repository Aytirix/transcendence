import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './assets/styles/intro.scss';

function Intro() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

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
                    <div className="floating-element floating-element-2">⭐</div>
                    <div className="floating-element floating-element-3">🏆</div>
                    <div className="floating-element floating-element-4">💫</div>
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
                        <h3 className="game-title">PONG</h3>
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

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">{t('home.why_transcendence')}</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>{t('home.real_time_gaming')}</h3>
                        <p>{t('home.real_time_description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🏆</div>
                        <h3>{t('home.competitive_play')}</h3>
                        <p>{t('home.competitive_description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>{t('home.social_features')}</h3>
                        <p>{t('home.social_description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎮</div>
                        <h3>{t('home.retro_experience')}</h3>
                        <p>{t('home.retro_description')}</p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>{t('home.ready_to_play')}</h2>
                    <p>{t('home.join_the_fun')}</p>
                    <div className="cta-buttons">
                        <button 
                            className="cta-button primary"
                            onClick={() => navigateToGame('pong')}
                        >
                            {t('home.start_with_pong')}
                        </button>
                        <button 
                            className="cta-button secondary"
                            onClick={() => navigateToGame('pacman')}
                        >
                            {t('home.try_pacman')}
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
                         | 
                        <button 
                            className="credits-link"
                            onClick={() => navigate('/credits')}
                        >
                            {t('home.project_credits')}
                        </button>
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Intro;


