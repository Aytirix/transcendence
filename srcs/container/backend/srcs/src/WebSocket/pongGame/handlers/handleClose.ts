import { playerStat } from "../types/playerStat";
import { waitingID, waitingMulti } from "../state/serverState";

export function handleClose(playerInfos: playerStat) {
	console.log("waiting close set")
	if (!playerInfos.game && playerInfos.mode !== "Tournament") {
		if (playerInfos.mode === "Multi" || playerInfos.mode === "MultiInvite") {
			if (waitingMulti.has(playerInfos)) //if
				waitingMulti.delete(playerInfos);
		}
		return;
	}
	if (playerInfos.game) {
		playerInfos.game.setStatus("KICKOFF") //deconnexion
		playerInfos.pauseGame = true;
		if (playerInfos.mode === "Multi" || playerInfos.mode === "Tournament" || playerInfos.mode === "MultiInvite") {
			if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name)
				playerInfos.game.getPlayer1().getPlayerInfos().pauseGame = false;
			else
				playerInfos.game.getPlayer2().getPlayerInfos().pauseGame = false;
		}
	}
	if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "SameKeyboard")
		waitingID.set(playerInfos.id, playerInfos);
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "Solo")
		waitingID.set(playerInfos.id, playerInfos);
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "Multi") {
		waitingID.set(playerInfos.id, playerInfos);
	}	
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "MultiInvite") {
		waitingID.set(playerInfos.id, playerInfos);
	}
	else if (waitingID.has(playerInfos.id) === false && playerInfos.mode === "Tournament") {
		waitingID.set(playerInfos.id, playerInfos);
	}
}