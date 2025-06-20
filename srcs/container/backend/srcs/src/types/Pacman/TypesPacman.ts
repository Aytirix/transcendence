import { WebSocket } from 'ws';
import Engine from '../../WebSocket/Pacman/game/Engine';

export type GameState = 'waiting' | 'active';

export interface room_settings {
	map: map;
}

export interface room {
	id: number;
	name: string;
	owner_id: number;
	owner_username: string;
	players?: player[];
	numberOfPlayers?: number;
	state: GameState;
	startTime?: number;
	settings: room_settings;
	engine?: Engine;
}

export type vector2 = {
	x: number;
	y: number;
};

export type request = {
	type: string;
	data: any;
};


export interface player {
	id: number;
	username: string;
	lang: string;
	avatar: string;
	updateAt: number;
	gameId: number;
	elo: number;
	room?: room;
	isSpectator?: boolean;
}

export enum TileType {
	Empty = ' ',
	Wall = '#',
	GhostPortalBlock = '-',
	Pellet = '.',
	Bonus = 'o',
	SpawnPacman = 'P',
	SpawnBlinky = 'B',
	SpawnInky = 'I',
	SpawnPinky = 'Y',
	SpawnClyde = 'C',
	Teleport = 'T',
}

export enum CharacterType {
	Pacman = 'P',
	Blinky = 'B',
	Pinky = 'Y',
	Inky = 'I',
	Clyde = 'C',
	Ghost = 'G',
}

export interface map {
	id?: number;
	user_id: number;
	name: string;
	map: TileType[][];
	is_public: boolean;
	is_valid: boolean;
	updated_at?: Date;
	created_at?: Date;
}

export interface userStatsPacman {
	pacman: {
		games_played: number;
		games_won: number;
		games_lost: number;
		win_rate: number;
		best_score: number;
		average_score: number;
	};
	ghosts: {
		games_played: number;
		games_won: number;
		games_lost: number;
		win_rate: number;
		best_score: number;
		average_score: number;
	};
	record_pacman: {
		id: number;
		username: string;
		score: number;
	}[];
	record_ghost: {
		id: number;
		username: string;
		score: number;
	}[];
}