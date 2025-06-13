import { playerStat } from "../types/playerStat";

export function handlePause(playerInfos: playerStat) {
	if (playerInfos.game.getStatus() === "KICKOFF" && playerInfos.game.getStatus() !== "SERVICE") {
		playerInfos.game.setStatus("PLAYING")
		playerInfos.socket.send(JSON.stringify({type: "Pause", value: false}))

	}
	else if (playerInfos.game.getStatus() === "PLAYING" && playerInfos.game.getStatus() !== "SERVICE") {
		playerInfos.game.setStatus("KICKOFF")
		playerInfos.socket.send(JSON.stringify({type: "Pause", value: true}))
	}
}