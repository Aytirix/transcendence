import { playerStat } from "../types/playerStat";

export function handlePause(playerInfos: playerStat) {


	if (playerInfos.game.getStatus() === "KICKOFF" 
	&& playerInfos.game.getStatus() !== "SERVICE") {
		if (playerInfos.mode === "Multi" || playerInfos.mode === "Tournament" || playerInfos.mode === "MultiInvite") {
			if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
				if (!playerInfos.game.getPlayer1().getPlayerInfos().pauseGame) {
					playerInfos.game.setStatus("PLAYING")
					playerInfos.timePause = 0;
					playerInfos.pauseGame = false;
					playerInfos.socket.send(JSON.stringify({type: "Pause", value: false}))
					playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: false}))
				}
			}
			else {
				if (!playerInfos.game.getPlayer2().getPlayerInfos().pauseGame) {
					playerInfos.game.setStatus("PLAYING")
					playerInfos.timePause = 0;
					playerInfos.pauseGame = false;
					playerInfos.socket.send(JSON.stringify({type: "Pause", value: false}))
					playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: false}))
				}
			} 
		}
		else {
			playerInfos.game.setStatus("PLAYING")
			playerInfos.socket.send(JSON.stringify({type: "Pause", value: false}))
		}
	}
	else if (playerInfos.game.getStatus() === "PLAYING" 
	&& playerInfos.game.getStatus() !== "SERVICE") {
		if (playerInfos.mode === "Multi" || playerInfos.mode === "Tournament" || playerInfos.mode === "MultiInvite") {
			if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
				if (!playerInfos.game.getPlayer1().getPlayerInfos().pauseGame) {
					playerInfos.game.setStatus("KICKOFF")
					playerInfos.timePause = Date.now()
					playerInfos.pauseGame = true;
					playerInfos.socket.send(JSON.stringify({type: "Pause", value: true, message: "Press [ ESP ] for PLAY"}))
					playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true, message: "Adversaire en pause. Reprise imminente."}))
				}
			}
			else {
				if (!playerInfos.game.getPlayer2().getPlayerInfos().pauseGame) {
					playerInfos.game.setStatus("KICKOFF")
					playerInfos.timePause = Date.now()
					playerInfos.pauseGame = true;
					playerInfos.socket.send(JSON.stringify({type: "Pause", value: true, message: "Press [ ESP ] for PLAY"}))
					playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true, message: "Adversaire en pause. Reprise imminente."}))
				}
			}
		}
		else {
				playerInfos.game.setStatus("KICKOFF")
				playerInfos.socket.send(JSON.stringify({type: "Pause", value: true, message: "Press [ ESP ] for PLAY"}))
		}
	}
}
