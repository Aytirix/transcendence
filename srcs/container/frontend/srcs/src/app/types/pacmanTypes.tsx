import { WebSocketStatus } from '../../api/useSafeWebSocket';
import { User } from './userTypes';

export interface room {
	id: number;
	name: string;
	owner_id: number;
	owner_username: string;
	players?: player[];
	numberOfPlayers?: number;
}

export interface vector2 {
	x: number;
	y: number;
}

export interface player extends User {
	character?: string;
	position?: vector2;
	score?: number;
	elo?: number;
}

export interface state {
	ws: WebSocket | null;
	statusws?: WebSocketStatus;
	player: player | null;
	maps: PacmanMap[];
	rooms: {
		active: room[];
		waiting: room[];
	}
	game: {
		launch: boolean;
		frightenedState: {
			remainingTime: number;
		}
		isSpectator: boolean;
		players: player[];
		grid: string[];
		pacmanLife: number;

		tileSize: number;
		paused: {
			paused: boolean;
			message: string;
		}
	};
}

export interface PacmanMap {
	id?: number;
	user_id: number;
	name: string;
	map: string[][];
	is_public: boolean;
	is_valid: boolean;
	errors: string[];
	updated_at?: Date;
	created_at?: Date;
}