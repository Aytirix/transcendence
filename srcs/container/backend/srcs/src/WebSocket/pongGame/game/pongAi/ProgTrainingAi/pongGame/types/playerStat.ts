import { Game } from "../game/Game";
import { Ai } from "../game/pongAi/qLearning";

export interface playerStat {
	game?: Game;
	avatar?: string;
	email?: string;
	name?: string;
	id?: number;
	mode?: "Multi" | "Solo" | "SameKeyboard" | "Tournament" | "Undefined" | "Move" | "EXIT" | "Ping";
	inGame : boolean;
	lastping?: number;
};