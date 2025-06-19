import React from 'react';
import './../../assets/styles/pacman/Statistics.scss';
import { useStatistics } from './hooks/useStatistics';
import StatsOverview from './components/StatsOverview';
import Leaderboard from './components/Leaderboard';
import { useLanguage } from '../../../contexts/LanguageContext';

const Statistics: React.FC = () => {
	const { stats, loading, error } = useStatistics();
	const { t } = useLanguage();

	if (loading) {
		return <div className="statistics loading">{t("pacman.menu.statistics.loading")}</div>;
	}

	if (error) {
		return <div className="statistics error">{t("pacman.menu.statistics.error")} {error}</div>;
	}

	return (
		<div className="statistics">
			<h2 className='stats-title'>{t("pacman.menu.statistics.title")}</h2>
			<div className='stats-content'>
				<StatsOverview
					totalGames={stats.totalGames}
					wins={stats.wins}
					losses={stats.losses}
					highestScore={stats.highestScore}
					averageScore={stats.averageScore}
				/>
				<Leaderboard players={stats.leaderboard} />
			</div>
		</div>
	);
};

export default Statistics;
