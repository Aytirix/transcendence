export interface PacmanStats {
	games_played: number;
	games_won: number;
	games_lost: number;
	win_rate: number;
	best_score: number;
	average_score: number;
}

export interface RecordPlayer {
	id: number;
	username: string;
	score: number;
}

export interface UserStatsPacman {
	pacman: PacmanStats;
	ghosts: PacmanStats;
	record_pacman: RecordPlayer[];
	record_ghost: RecordPlayer[];
}

export interface PacmanStatisticsResponse {
	success: boolean;
	stats: UserStatsPacman;
}
