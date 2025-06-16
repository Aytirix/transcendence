import { playerStat } from "../types/playerStat";
import { sockets } from "../state/serverState";
import { WebSocket } from "ws";
import { pingMonitoring } from "../pongSocketHandler";

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
		}
	}, 4000);
}