import React from 'react';
import './../../assets/styles/pacman/Statistics.scss';

const Statistics: React.FC = () => {
	const stats = {
		totalGames: 42,
		wins: 18,
		losses: 24,
		highestScore: 12345,
		averageScore: 6789,
		leaderboard: [
			{ username: "Player1", score: 12345 },
			{ username: "Player2", score: 11000 },
			{ username: "Player3", score: 9500 }
		]
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
				<div className='leaderboard'>
					<h3>Classement</h3>
					<ol className='leaderboard-list'>
						{Array.isArray(stats.leaderboard) && stats.leaderboard.length > 0 ? (
							stats.leaderboard.map((player, index) => (
								<li key={player.username || index} className={index === 0 ? 'first-place' : ''}>
									<span className='rank'>{index + 1}.</span>
									<span className='username'>{player.username}</span>
									<span className='score'>{player.score} pts</span>
								</li>
							))
						) : (
							<li className='no-scores'>Aucun score disponible</li>
						)}
					</ol>
				</div>
			</div>
			
		</div>

	);
};

export default Statistics;