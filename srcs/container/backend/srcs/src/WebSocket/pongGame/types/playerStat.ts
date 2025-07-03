import { Game } from "../game/Game";
import { WebSocket } from "ws";

export interface userStatsPong {
	victoire: 0,
	defaite: 0,
	abandon: 0,
	tournamentVictory: 0,
}

export interface playerStat {
	game?: Game;
	avatar?: string;
	email: string;
	name: string;
	id: number;
	idTournament?: number;
	matchTournamentNB?: number;
	resultMatchTournament?: "Loose" | "Win" | "Current";
	resultMatch?: "Loose" | "win";
	mode?: "Multi" | "MultiInvite" | "Solo" | "SameKeyboard" | "Tournament" | "Undefined" | "Move" | "EXIT" | "Pause" | "Ping";
	inGame : boolean;
	inRoom: boolean;
	socket: WebSocket;
	lastping?: number;
	timePause?: number;
	pauseGame?: boolean;
	friendId?: number;
	isReady?: boolean;
	readyToNext?: boolean;
	switchManche?: boolean;
};

export interface Tournament {
	listPlayer: Set<playerStat>;
	size: 4 | 8 | 16 | 32;
	name: string;
	winner?: boolean;
	isFull: boolean;
	idTournament?: number;
	currentMatch?: {player1: playerStat, player2:playerStat} [];
	currentManche?: number;
	waitingWinner?: playerStat [];
	nextManche?: boolean;
	historyTournament?: {
		nbRound: number,
		round: number, 
		matchNB: {
		number: number;
		player1: playerStat;
		p1ResultMatchTournament?: "Loose" | "Win" | "Current";
		player2: playerStat;
		p2ResultMatchTournament?: "Loose" | "Win" | "Current";
		}[];
	} [];
}