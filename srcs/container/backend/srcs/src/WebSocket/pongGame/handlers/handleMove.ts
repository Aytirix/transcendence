import { playerStat } from "../types/playerStat";

export function handleMove(playerInfos: playerStat, cmd: string)
{
	if (!playerInfos.game || playerInfos.game.getStatus() !== "PLAYING") return;
	switch (cmd) {
		case "p1_up" :
			playerInfos.game.getPlayer1().move("up");
			break ;
		case "p1_down" :
			playerInfos.game.getPlayer1().move("down");
			break ;
		case "p2_up" :
			if (playerInfos.mode === "Multi" || playerInfos.mode === "Tournament" || playerInfos.mode === "MultiInvite")
				playerInfos.game.getPlayer2().move("down");
			else
				playerInfos.game.getPlayer2().move("up");
			break ;
		case "p2_down" :
			if (playerInfos.mode === "Multi" || playerInfos.mode === "Tournament" || playerInfos.mode === "MultiInvite")
				playerInfos.game.getPlayer2().move("up");
			else
				playerInfos.game.getPlayer2().move("down");
			break ;
	}
}