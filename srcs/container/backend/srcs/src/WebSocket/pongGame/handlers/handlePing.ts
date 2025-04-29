import { playerStat } from "../types/playerStat";
import { sockets } from "../state/serverState";
import { WebSocket } from "ws";

export function handlePing(playerInfos: playerStat) {
	playerInfos.lastping = Date.now();
	console.log("pong");
	playerInfos.socket.send("Pong");
}

export function startingPing(sockets: Map<WebSocket, playerStat>) {
	setInterval(() => {
		for (const [playerSocket, playerInfos] of sockets) {

			const isInactive = (Date.now() - playerInfos.lastping) > 7000
			if (isInactive) {
				console.log("Deconnection of player")
				if (playerInfos.game)
					playerInfos.game.setStatus("EXIT")
				sockets.delete(playerSocket);
				playerSocket.close();
			}
		}
	}, 4000);
}