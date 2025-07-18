import { playerStat } from "../types/playerStat";
import { listTournament, sockets } from "../state/serverState";
import { WebSocket } from "ws";
import { pingMonitoring } from "../pongSocketHandler";
import { isOnFinishMatch } from "./handleTournament";

export function handlePing(playerInfos: playerStat) {
		playerInfos.lastping = Date.now();
		playerInfos.socket.send(JSON.stringify({type: "pong"}));
}

export function startingPing(sockets: Map<WebSocket, playerStat>) {
	setInterval(() => {
		for (const [playerSocket, playerInfos] of sockets) {
			const isInactive = (Date.now() - playerInfos.lastping) > 30000
			if (isInactive) {
				console.log(`Deconnection of player username => ${playerInfos.name}`);
				playerInfos.resultMatch = "Loose"
				if (playerInfos.mode === "Multi" || playerInfos.mode === "MultiInvite") {
					if (playerInfos && playerInfos.game) {
						if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "win"
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "Loose"
						}
						else {
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "win"
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "Loose"
						}
					}
				}
				if (playerInfos.mode === "Tournament") {
					if (playerInfos && playerInfos.game) {
						if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatchTournament = "Win"
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "Loose"
							if (!playerInfos.game.getIsStarted()) {
								const tournament = listTournament.get(playerInfos.idTournament);
								isOnFinishMatch(tournament , playerInfos.game.getPlayer1().getPlayerInfos(), playerInfos);
							}
						}
						else {
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatchTournament = "Win"
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "Loose"
							if (!playerInfos.game.getIsStarted()) {
								const tournament = listTournament.get(playerInfos.idTournament);
								isOnFinishMatch(tournament , playerInfos, playerInfos.game.getPlayer2().getPlayerInfos()); 
							}
						}
					}
				}
				if (playerInfos.game)
					playerInfos.game.setStatus("EXIT");
				sockets.delete(playerSocket);
				playerSocket.close();
			}
			if ((playerInfos.mode === "MultiInvite" || playerInfos.mode === "Multi") && playerInfos.timePause) {
				const isInactivePause = (Date.now() - playerInfos.timePause) > 30000
				if (isInactivePause) {
						playerInfos.resultMatch = "Loose"
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "win"
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "Loose"

					}
					else {
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "win"
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "Loose"
					}
					if (playerInfos.game)
						playerInfos.game.setStatus("EXIT");
				}
			}
			else if (playerInfos.mode === "Tournament" && playerInfos.timePause) {
				const isInactivePause = (Date.now() - playerInfos.timePause) > 30000
				if (isInactivePause) {
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatchTournament = "Win"
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "Loose"
						playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: playerInfos.game.getPlayer1().getPlayerInfos().name}));
					}
					else {
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatchTournament = "Win"
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "Loose"
						playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: playerInfos.game.getPlayer2().getPlayerInfos().name}));

					}
					if (playerInfos.game)
						playerInfos.game.setStatus("EXIT");
				}
			}
		}
	}, 4000);
}
