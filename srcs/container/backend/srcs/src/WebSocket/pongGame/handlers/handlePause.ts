import { playerStat } from "../types/playerStat";

export function handlePause(playerInfos: playerStat) {
	if (playerInfos.game.getStatus() === "KICKOFF" && playerInfos.game.getStatus() !== "SERVICE") {
		playerInfos.game.setStatus("PLAYING")
		playerInfos.socket.send(JSON.stringify({type: "Pause", value: false}))
		if (playerInfos.mode === "Multi") {
			playerInfos.timePause = 0;
			if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name)
				playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: false}))
			else
				playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: false}))
		}

	}
	else if (playerInfos.game.getStatus() === "PLAYING" && playerInfos.game.getStatus() !== "SERVICE") {
		playerInfos.game.setStatus("KICKOFF")
		playerInfos.socket.send(JSON.stringify({type: "Pause", value: true}))
		if (playerInfos.mode === "Multi") {
			playerInfos.timePause = Date.now()
			if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name)
				playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true}))
			else
				playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true}))
		}
	}
}