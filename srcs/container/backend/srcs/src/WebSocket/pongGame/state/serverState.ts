import { player } from "@Pacman/TypesPacman";
import { playerStat, Tournament } from "../types/playerStat";
import { WebSocket } from "ws";

//information general : Map -> socket , players information
export const sockets = new Map<WebSocket, playerStat>();

//information : Map -> id.player, players waiting reconnection
export const waitingID = new Map<number, playerStat>();

//information : set -> player waiting for multi
export const waitingMulti = new Set<playerStat>();

export const waitingMultiInvite = new Set<playerStat>();

//information : set -> player waiting for tournament
export const listTournament = new Map<number, Tournament>();

export function getIngame(id: number): { inGame: boolean, nav: string } {
	for (const [, player] of waitingID) {
		if (player.id === id) {
			let redirection = "";
			console.log("Player mode:", player.mode);
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
					console.log("get in game tournament in room", player.inRoom);
					if (player.inRoom) {
						redirection = "/pong/menu/Tournament";
					}
					break;
				case "MultiInvite":
					redirection = "/pong/menu/MultiPlayersInvite";
					break;
			}
			return {
				inGame: player.inGame,
				nav: redirection
			};
		}
	}
	return { inGame: false, nav: '' };
}