import { playerStat } from "../types/playerStat";

export function handlePause(playerInfos: playerStat) {
	if (playerInfos.game.getStatus() === "KICKOFF")
		playerInfos.game.setStatus("PLAYING")
	else if (playerInfos.game.getStatus() === "PLAYING")
		playerInfos.game.setStatus("KICKOFF")
}