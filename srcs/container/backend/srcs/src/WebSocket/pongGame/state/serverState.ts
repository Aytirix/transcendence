import { player } from "@Pacman/TypesPacman";
import { playerStat, Tournament } from "../types/playerStat";
import { WebSocket } from "ws";

//information general : Map -> socket , players information
export const sockets = new Map<WebSocket, playerStat>();

//information : Map -> id.player, players waiting reconnection
export const waitingID = new Map<number, playerStat>();

//information : set -> player waiting for multi
export const waitingMulti = new Set<playerStat>();

//information : set -> player waiting for tournament
export const listTournament = new Map<number, Tournament>();

export function getIngame(id: number): { inGame: boolean, nav: string } | null {
	for (const [, player] of sockets) {
		if (player.id === id) {
			let redirection = "";

			switch (player.mode) {
				case "SameKeyboard":
					redirection = "/pong/menu/SameKeyboard";
					break;
				case "Solo":
					redirection = "/pong/menu/Solo";
					break;
				case "Multi":
					redirection = "/pong/menu/MultiPlayers";
					break;
				case "Tournament":
					redirection = "/pong/menu/GameTournament";
					break;
			}
			return {
				inGame: player.inGame,
				nav: redirection
			};
		}
	}
	return null;
}