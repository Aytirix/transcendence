import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface Player {
	username: string;
	score: number;
}

interface LeaderboardProps {
	players: Player[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
	const { t } = useLanguage();

	return (
		<div className='leaderboard'>
			<h3>{t("pacman.menu.statistics.leaderboard")}</h3>
			<ol className='leaderboard-list'>
				{Array.isArray(players) && players.length > 0 ? (
					players.map((player, index) => (
						<li key={player.username || index} className={index === 0 ? 'first-place' : ''}>
							<span className='rank'>{index + 1}.</span>
							<span className='username'>{player.username}</span>
							<span className='score' style={{ marginLeft: '1em' }}>{player.score} pts</span>
						</li>
					))
				) : (
					<li className='no-scores'>{t("pacman.menu.statistics.noStats")}</li>
				)}
			</ol>
		</div>
	);
};

export default Leaderboard;
