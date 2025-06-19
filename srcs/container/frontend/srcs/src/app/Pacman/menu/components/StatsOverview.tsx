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
		<div className='stats-content'>
			<div>{t("pacman.menu.statistics.gamesPlayed")}: {totalGames}</div>
			<div>{t("pacman.menu.statistics.gamesWon")}: {wins}</div>
			<div>{t("pacman.menu.statistics.gamesLost")}: {losses}</div>
			<div>{t("pacman.menu.statistics.winRate")}: {winrate}%</div>
			<div>{t("pacman.menu.statistics.bestScore")}: {highestScore}</div>
			<div>{t("pacman.menu.statistics.averageScore")}: {averageScore}</div>
		</div>
	);
};

export default StatsOverview;
