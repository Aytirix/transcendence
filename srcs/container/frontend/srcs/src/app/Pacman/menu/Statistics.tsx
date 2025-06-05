import React from 'react';
import './../../assets/styles/pacman/Statistics.scss';

const Statistics: React.FC = () => {
	const stats = {
		totalGames: 42,
		wins: 18,
		losses: 24,
		highestScore: 12345,
		averageScore: 6789,
		bestStreak: 5,
		mostPlayedMap: 'Classique',
		winRatePerMap: [
			{ map: 'Classique', winrate: 60 },
			{ map: 'Labyrinthe', winrate: 40 },
			{ map: 'Ouvert', winrate: 50 },
		],
		totalPlayTime: '3h 21m',
		averageGameDuration: '4m 35s',
		achievements: [
			'Premier jeu terminé',
			'Score > 10 000',
			'5 victoires consécutives',
		],
		leaderboard: [
			{ username: 'Alice', score: 15000 },
			{ username: 'Bob', score: 14000 },
			{ username: 'Charlie', score: 13500 },
			{ username: 'David', score: 12000 },
			{ username: 'Eve', score: 11000 },
		],
	};

	return (
		<div className="statistics">
			<h2 className='stats-title'>Statistiques Pacman</h2>
			<div className='stats-content'>
				<div>Parties : {stats.totalGames}</div>
				<div>Victoires : {stats.wins}</div>
				<div>Défaites : {stats.losses}</div>
				<div>Winrate : {((stats.wins / stats.totalGames) * 100).toFixed(1)}%</div>
				<div>Score max : {stats.highestScore}</div>
				<div>Moyenne : {stats.averageScore}</div>
				<div>Série : {stats.bestStreak}</div>
				<div>Carte : {stats.mostPlayedMap}</div>
				<div>Temps : {stats.totalPlayTime}</div>
				<h3>Winrate par carte</h3>
				{stats.winRatePerMap.map((m) => (
					<div key={m.map}>
						{m.map} : {m.winrate}%
					</div>
				))}
				<h3>Succès</h3>
				{stats.achievements.map((ach, i) => (
					<div key={i}>🏆 {ach}</div>
				))}
				<h3>Leaderboard</h3>
				<ol>
					{stats.leaderboard.map((p, i) => (
						<li key={p.username}>
							<span style={{ fontWeight: i === 0 ? 'bold' : undefined }}>
								{i + 1}. {p.username} — {p.score} pts
							</span>
						</li>
					))}
				</ol>
			</div>
		</div>

	);
};

export default Statistics;