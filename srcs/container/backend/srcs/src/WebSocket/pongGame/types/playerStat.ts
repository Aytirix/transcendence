import { Game } from "../game/Game";
import { WebSocket } from "ws";

export interface playerStat {
	game?: Game;
	avatar?: string;
	email: string;
	name: string;
	id: number;
	mode?: "Multi" | "Solo" | "SameKeyboard" | "Tournament" | "Undefined" | "Move" | "EXIT" | "Ping";
	inGame : boolean;
	socket: WebSocket;
	lastping?: number;
};

export interface Tournament {
	listPlayer: Set<playerStat>;
	size: 4 | 8 | 16 | 32;
	name: string;
	winner?: string;
	isFull: boolean;
}