import { useState, useEffect } from 'react';

interface Player {
	username: string;
	score: number;
}

interface Statistics {
	totalGames: number;
	wins: number;
	losses: number;
	highestScore: number;
	averageScore: number;
	leaderboard: Player[];
}

export function useStatistics() {
	const [stats] = useState<Statistics>({
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
	});

	const [loading] = useState(false);
	const [error] = useState<string | null>(null);

	// Ici, vous pourriez ajouter la logique pour récupérer les vraies statistiques
	// depuis une API ou WebSocket
	useEffect(() => {
		// Simulation d'un chargement
		// Dans le futur, remplacez ceci par un appel API réel
	}, []);

	return { stats, loading, error };
}
