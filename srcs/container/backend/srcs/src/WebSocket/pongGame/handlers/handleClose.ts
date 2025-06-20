import { playerStat } from "../types/playerStat";
import { waitingID, waitingMulti } from "../state/serverState";

export function handleClose(playerInfos: playerStat) {
	if (!playerInfos.game) {
		if (playerInfos.mode === "Multi")
			waitingMulti.delete(playerInfos);
		return;
	}
	playerInfos.game.setStatus("KICKOFF") //deconnexion
	playerInfos.pauseGame = true;
	if (playerInfos.mode === "Multi") {
		if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name)
			playerInfos.game.getPlayer1().getPlayerInfos().pauseGame = false;
		else
			playerInfos.game.getPlayer2().getPlayerInfos().pauseGame = false;
	}
	if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "SameKeyboard")
		waitingID.set(playerInfos.id, playerInfos);
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "Solo")
		waitingID.set(playerInfos.id, playerInfos);
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "Multi") {
		waitingID.set(playerInfos.id, playerInfos);
	}
	// setTimeout(() => {
	// 	if (playerInfos.mode === "SameKeyboard")
	// 		waitingID.delete(playerInfos.id);
	// 	else if (playerInfos.mode === "Multi")
	// 		waitingID.delete(playerInfos.id);
	// 	else if (playerInfos.mode === "Solo")
	// 		waitingID.delete(playerInfos.id);
	// }, 30000);
}