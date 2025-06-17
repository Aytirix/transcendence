import React from 'react';
import './../../assets/styles/pacman/Statistics.scss';
import { useStatistics } from './hooks/useStatistics';
import StatsOverview from './components/StatsOverview';
import Leaderboard from './components/Leaderboard';

const Statistics: React.FC = () => {
	const { stats, loading, error } = useStatistics();

	if (loading) {
		return <div className="statistics loading">Chargement des statistiques...</div>;
	}

	if (error) {
		return <div className="statistics error">Erreur: {error}</div>;
	}

	return (
		<div className="statistics">
			<h2 className='stats-title'>Statistiques Pacman</h2>
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
