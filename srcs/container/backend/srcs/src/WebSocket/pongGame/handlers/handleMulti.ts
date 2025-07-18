import { waitingMulti } from "../state/serverState";
import { playerStat } from "../types/playerStat";
import { webMsg } from "../types/webMsg";
import { createGame } from "../game/initGame";
import { Game } from "../game/Game";
import modelPong from "@models/modelPong";

export function handleMulti(playerInfos: playerStat, msg: webMsg) {
	if (!playerInfos) return ;
	playerInfos.mode = msg.type;
	if (waitingMulti.size === 1 && waitingMulti.has(playerInfos) === true) return ;
	if (waitingMulti.size >= 1) {
		for (const player2Infos of waitingMulti) {
			if (player2Infos.id !== playerInfos.id) {
				console.log("in game")
				waitingMulti.delete(player2Infos);
				playerInfos.inGame = true;
				player2Infos.inGame = true;
				const multiGame : Game = createGame(playerInfos, player2Infos);
				playerInfos.game = multiGame;
				player2Infos.game = multiGame;
				multiGame.start();
				return ;
			}
		}
	}
	waitingMulti.add(playerInfos);
	console.log("en attente d un second joueur ");
}