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

export interface player extends User {
	elo?: number;
}

export interface state {
	ws: WebSocket | null;
	statusws?: WebSocketStatus;
	player: player | null;
	rooms: {
		active: room[];
		waiting: room[];
	}
}
