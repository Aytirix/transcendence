import { playerStat } from "../types/playerStat";
import { waitingID } from "../state/serverState";

export function handleClose(playerInfos: playerStat) {
	if (!playerInfos.game) return ;
	playerInfos.game.setStatus("WAITING")
	if (waitingID.has(playerInfos.id) === false)
		waitingID.set(playerInfos.id, playerInfos);
	setTimeout(() => {
		waitingID.delete(playerInfos.id);
	}, 5000);
}