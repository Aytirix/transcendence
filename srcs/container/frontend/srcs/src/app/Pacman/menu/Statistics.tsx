import React from 'react';
import './../../assets/styles/pacman/Statistics.scss';
import { useStatistics } from './hooks/useStatistics';
import StatsOverview from './components/StatsOverview';
import Leaderboard from './components/Leaderboard';
import { useLanguage } from '../../../contexts/LanguageContext';

const Statistics: React.FC = () => {
	const { stats, error } = useStatistics();
	const { t } = useLanguage();

	if (error) {
		return <div className="statistics error">{t("pacman.menu.statistics.error")} {error}</div>;
	}

	return (
		<div className="statistics">
			<h2 className='stats-title'>{t("pacman.menu.statistics.title")}</h2>
			<div className='stats-content'>
				<div className='stats-section pacman-section'>
					<h3 className='stats-subtitle pacman-subtitle'>{t("pacman.menu.statistics.pacman")}</h3>
					<StatsOverview
						totalGames={stats.pacman.totalGames}
						wins={stats.pacman.wins}
						losses={stats.pacman.losses}
						highestScore={stats.pacman.highestScore}
						averageScore={stats.pacman.averageScore}
					/>
					<Leaderboard players={stats.leaderboardPacman} />
				</div>
				
				<div className='stats-section ghost-section'>
					<h3 className='stats-subtitle ghost-subtitle'>{t("pacman.menu.statistics.ghosts")}</h3>
					<StatsOverview
						totalGames={stats.ghosts.totalGames}
						wins={stats.ghosts.wins}
						losses={stats.ghosts.losses}
						highestScore={stats.ghosts.highestScore}
						averageScore={stats.ghosts.averageScore}
					/>
					<Leaderboard players={stats.leaderboardGhost} />
				</div>
			</div>
		</div>
	);
};

export default Statistics;
