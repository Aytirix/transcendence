import { playerStat } from "../types/playerStat";

export function handleFinish(playerInfos: playerStat) {
	if (!playerInfos.inGame) return;
	console.log("icicicicici")
	playerInfos.inGame = false;
	playerInfos.game.setStatus("EXIT");
}