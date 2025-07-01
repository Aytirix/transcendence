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
				if (playerInfos.mode === "Multi") {
					if (playerInfos && playerInfos.game) {
						if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "win"
						}
						else {
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "win"
						}
					}
				}
				if (playerInfos.mode === "Tournament") {
					if (playerInfos && playerInfos.game) {
						if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
							playerInfos.game.getPlayer1().getPlayerInfos().resultMatchTournament = "Win"
							if (!playerInfos.game.getIsStarted()) {
								const tournament = listTournament.get(playerInfos.idTournament);
								isOnFinishMatch(tournament , playerInfos.game.getPlayer1().getPlayerInfos(), playerInfos);
							}
							console.log("deco")
						}
						else {
							playerInfos.game.getPlayer2().getPlayerInfos().resultMatchTournament = "Win"
							if (!playerInfos.game.getIsStarted()) {
								const tournament = listTournament.get(playerInfos.idTournament);
								isOnFinishMatch(tournament , playerInfos, playerInfos.game.getPlayer2().getPlayerInfos()); 
							}
							console.log("deco")
						}
					}
				}
				if (playerInfos.game)
					playerInfos.game.setStatus("EXIT");
				sockets.delete(playerSocket);
				playerSocket.close();
			}
			if (playerInfos.mode === "Multi" && playerInfos.timePause) {
				const isInactivePause = (Date.now() - playerInfos.timePause) > 30000
				if (isInactivePause) {
						playerInfos.resultMatch = "Loose"
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "win"
					}
					else {
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "win"
					}
					if (playerInfos.game)
						playerInfos.game.setStatus("EXIT");
				}
			}
			else if (playerInfos.mode === "Tournament" && playerInfos.timePause) {
				const isInactivePause = (Date.now() - playerInfos.timePause) > 30000
				if (isInactivePause) {
						playerInfos.resultMatch = "Loose"
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatchTournament = "Win"
						playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: "win"}));
						console.log("deco1")
					}
					else {
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatchTournament = "Win"
						playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: "win"}));
						console.log("deco1")

					}
					if (playerInfos.game)
						playerInfos.game.setStatus("EXIT");
				}
			}
		}
	}, 4000);
}
