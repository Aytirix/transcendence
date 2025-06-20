import { useState, useEffect } from 'react';
import ApiService from '../../../../api/ApiService';
import { PacmanStatisticsResponse } from '../../../../types/pacman';

interface Player {
	username: string;
	score: number;
}

interface Statistics {
	pacman: {
		totalGames: number;
		wins: number;
		losses: number;
		winRate: number;
		highestScore: number;
		averageScore: number;
	};
	ghosts: {
		totalGames: number;
		wins: number;
		losses: number;
		winRate: number;
		highestScore: number;
		averageScore: number;
	};
	leaderboardPacman: Player[];
	leaderboardGhost: Player[];
}

export function useStatistics() {
	const [stats, setStats] = useState<Statistics>({
		pacman: {
			totalGames: 0,
			wins: 0,
			losses: 0,
			winRate: 0,
			highestScore: 0,
			averageScore: 0,
		},
		ghosts: {
			totalGames: 0,
			wins: 0,
			losses: 0,
			winRate: 0,
			highestScore: 0,
			averageScore: 0,
		},
		leaderboardPacman: [],
		leaderboardGhost: [],
	});

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStatistics = async () => {
			try {
				setError(null);
				
				const response: PacmanStatisticsResponse = await ApiService.get('/pacman/statistics', null, false);
				
				if (response.success && response.stats) {
					const data = response.stats;
					setStats({
						pacman: {
							totalGames: data.pacman.games_played,
							wins: data.pacman.games_won,
							losses: data.pacman.games_lost,
							winRate: data.pacman.win_rate,
							highestScore: data.pacman.best_score,
							averageScore: data.pacman.average_score,
						},
						ghosts: {
							totalGames: data.ghosts.games_played,
							wins: data.ghosts.games_won,
							losses: data.ghosts.games_lost,
							winRate: data.ghosts.win_rate,
							highestScore: data.ghosts.best_score,
							averageScore: data.ghosts.average_score,
						},
						leaderboardPacman: data.record_pacman.map(record => ({
							username: record.username,
							score: record.score,
						})),
						leaderboardGhost: data.record_ghost.map(record => ({
							username: record.username,
							score: record.score,
						})),
					});
				} else {
					setError('Erreur lors du chargement des statistiques');
				}
			} catch (err) {
				console.error('Error fetching statistics:', err);
				setError('Erreur de connexion');
			}
		};

		fetchStatistics();
	}, []);

	return { stats, error };
}
