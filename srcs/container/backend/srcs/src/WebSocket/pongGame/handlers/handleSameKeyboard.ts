import { playerStat } from "../types/playerStat";
import { webMsg } from "../types/webMsg";
import { createGame } from "../game/initGame";

export function handleSameKeyboard(playerInfos: playerStat, msg: webMsg) {
	if (!playerInfos) return;
	playerInfos.mode = msg.type;
	playerInfos.inGame = true;
	playerInfos.game = createGame(playerInfos);
	console.log(`start game samekeyboard for ${playerInfos.name}`);
	playerInfos.game.start();
}