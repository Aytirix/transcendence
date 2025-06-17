import React from 'react';

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
	const winrate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

	return (
		<div className='stats-content'>
			<div>Parties : {totalGames}</div>
			<div>Victoires : {wins}</div>
			<div>Défaites : {losses}</div>
			<div>Winrate : {winrate}%</div>
			<div>Score max : {highestScore}</div>
			<div>Moyenne : {averageScore}</div>
		</div>
	);
};

export default StatsOverview;
