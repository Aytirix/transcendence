import React from 'react';

interface Player {
	username: string;
	score: number;
}

interface LeaderboardProps {
	players: Player[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
	return (
		<div className='leaderboard'>
			<h3>Classement</h3>
			<ol className='leaderboard-list'>
				{Array.isArray(players) && players.length > 0 ? (
					players.map((player, index) => (
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
	);
};

export default Leaderboard;
