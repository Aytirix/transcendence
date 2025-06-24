import { useLanguage } from '../contexts/LanguageContext';
import './assets/styles/credits.scss';

function Credits() {
	const { t } = useLanguage();

    const developers = [
        {
            login: 'thmouty',
            name: 'Theo Mouty',
            photo: 'https://cdn.intra.42.fr/users/a08c0df0f3154c3567ef9974e3cdceea/thmouty.jpg',
            role: t('credits.role.lead'),
            contributions: [
                t('credits.contributions.projectArchitecture'),
                t('credits.contributions.userAuthentication'),
                t('credits.contributions.googleOAuthIntegration'),
                t('credits.contributions.twoFAImplementation'),
                t('credits.contributions.pacManBackend'),
                t('credits.contributions.chatSystemBackend'),
                t('credits.contributions.projectConfiguration'),
                t('credits.contributions.databaseDesign'),
                t('credits.contributions.avatarManagementSystem')
            ]
        },
        {
            login: 'gacavali',
            name: 'Gabriel Cavalier',
            photo: 'https://cdn.intra.42.fr/users/9c72703c120e32659983449b85b025b1/gacavali.jpg',
            role: t('credits.role.pongFullstack'),
            contributions: [
                t('credits.contributions.completePongDevelopment'),
                t('credits.contributions.pongFrontendInterface'),
                t('credits.contributions.pongBackendLogic'),
                t('credits.contributions.realTimeMultiplayerSystem'),
                t('credits.contributions.uiUxDesign'),
                t('credits.contributions.gameMatchmaking'),
                t('credits.contributions.pongStatisticsScoring'),
				t('credits.contributions.pongAI')
            ]
        },
        {
            login: 'yenaiji',
            name: 'Yessine Naiji',
            photo: 'https://cdn.intra.42.fr/users/d75d575fb7b82c1d6eb10d69670b892c/yenaiji.jpg',
            role: t('credits.role.generalFrontend'),
            contributions: [
                t('credits.contributions.loginRegisterInterfaces'),
                t('credits.contributions.userProfileManagement'),
                t('credits.contributions.avatarUploadSystem'),
                t('credits.contributions.navigationBar'),
                t('credits.contributions.chatSystemFrontend'),
                t('credits.contributions.uiUxDesign')
            ]
        },
        {
            login: 'cgorin',
            name: 'Camille Gorin',
            photo: 'https://cdn.intra.42.fr/users/ee730a412005a752267949978eacef43/cgorin.jpg',
            role: t('credits.role.pacManFrontend'),
            contributions: [
                t('credits.contributions.pacManGameInterface'),
                t('credits.contributions.interactiveMapCreation'),
                t('credits.contributions.gameMechanicsImplementation'),
                t('credits.contributions.statisticsDashboard'),
                t('credits.contributions.gameLobbySystem'),
                t('credits.contributions.uiUxDesign'),
                t('credits.contributions.playerProgressionTracking')
            ]
        }
    ];

    return (
        <div className="credits-container">
            <div className="credits-background"></div>
            
            <div className="credits-content">
                <header className="credits-header">
                    <h1 className="credits-title">
                        <span className="gradient-text">{t('project_credits')}</span>
                    </h1>
                </header>

                <div className="developers-grid">
                    {developers.map((dev, index) => (
                        <div key={dev.login} className="developer-card" data-index={index}>
                            <div className="developer-header">
                                <div className="developer-avatar">
                                    <img 
                                        src={dev.photo} 
                                        alt={dev.name}
                                        className="developer-photo"
                                    />
                                </div>
                                <div className="developer-info">
                                    <h3 className="developer-name">{dev.name}</h3>
                                    <p className="developer-login">@{dev.login}</p>
                                    <p className="developer-role">{dev.role}</p>
                                </div>
                                <a 
                                    href={`https://profile.intra.42.fr/users/${dev.login}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-link"
                                    title={`Voir le profil de ${dev.name}`}
                                >
                                    🔗
                                </a>
                            </div>
                            
                            <div className="contributions-section">
                                <h4 className="contributions-title">{t('credits.contributions_title')}</h4>
                                <ul className="contributions-list">
                                    {dev.contributions.map((contribution, idx) => (
                                        <li key={idx} className="contribution-item">
                                            <span className="contribution-bullet">•</span>
                                            {contribution}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="credits-footer">
                    <div className="project-info">
                        <h3>{t('project_transcendence')}</h3>
                        <div className="tech-stack">
                            <span className="tech-item">React</span>
                            <span className="tech-item">TypeScript</span>
                            <span className="tech-item">Node.js</span>
                            <span className="tech-item">Docker</span>
							<span className="tech-item">SQLite</span>
                            <span className="tech-item">Babylon.js</span>
                            <span className="tech-item">Fastify</span>
                            <span className="tech-item">Swagger</span>
                            <span className="tech-item">WebSocket</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Credits;
