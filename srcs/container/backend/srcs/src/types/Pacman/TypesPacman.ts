import { WebSocket } from 'ws';
import Engine from '../../WebSocket/Pacman/game/Engine';

export type GameState = 'waiting' | 'active' | 'finished';

export interface room {
	id: number;
	name: string;
	owner_id: number;
	owner_username: string;
	players?: player[];
	numberOfPlayers?: number;
	state: GameState;
	startTime?: number;
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
	Inky = 'I',
	Pinky = 'Y',
	Clyde = 'C',
	Ghost = 'G',
}