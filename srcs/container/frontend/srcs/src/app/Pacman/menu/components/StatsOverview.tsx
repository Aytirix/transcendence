import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface StatsOverviewProps {
	totalGames: number;
	wins: number;
	losses: number;
	highestScore: number;
	averageScore: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
	totalGames,
	wins,
	losses,
	highestScore,
	averageScore
}) => {
	const { t } = useLanguage();
	const winrate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

	return (
		<div className='stats-overview'>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.gamesPlayed")}:</span>
				<span className='stat-value'>{totalGames}</span>
			</div>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.gamesWon")}:</span>
				<span className='stat-value'>{wins}</span>
			</div>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.gamesLost")}:</span>
				<span className='stat-value'>{losses}</span>
			</div>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.winRate")}:</span>
				<span className='stat-value'>{winrate}%</span>
			</div>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.bestScore")}:</span>
				<span className='stat-value'>{highestScore}</span>
			</div>
			<div className='stat-item'>
				<span className='stat-label'>{t("pacman.menu.statistics.averageScore")}:</span>
				<span className='stat-value'>{averageScore}</span>
			</div>
		</div>
	);
};

export default StatsOverview;
