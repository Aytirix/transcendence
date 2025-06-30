import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { webMsg } from './types/webMsg';
import { isJson } from './utils/isJson';
import { sockets, waitingID } from './state/serverState';
import { handleMove } from './handlers/handleMove';
import { handleSameKeyboard } from './handlers/handleSameKeyboard';
import { handleMulti } from './handlers/handleMulti';
import { handleClose } from './handlers/handleClose';
import { handlePing, startingPing } from './handlers/handlePing';
import { playerStat } from './types/playerStat';
import { handleReconnection } from './handlers/handleReconnection';
import { handleFinish } from './handlers/handleFinish';
import { handleSolo } from './handlers/handleSolo';
import { handleTournament } from './handlers/handleTournament';
import { handlePause } from './handlers/handlePause';

export let pingMonitoring: boolean = false;

export function pongWebSocket(socket: WebSocket, user: User) {
	if (handleReconnection(socket, user)){}
	else {
		const playerInfos: playerStat = {
				avatar: user.avatar,
				email: user.email,
				name: user.username,
				id: user.id,
				mode: "Undefined",
				inGame: false,
				inRoom: false,
				socket: socket,
				lastping: Date.now(),
				timePause: 0,
				pauseGame: false,
				readyToNext: false,
				switchManche: false,
			};
			sockets.set(socket, playerInfos);
	}
	if (!pingMonitoring) {
		pingMonitoring = true;
		startingPing(sockets);
	}
	socket.on('message', (data: RawData) => {
		const playerInfos = sockets.get(socket);
		if (!playerInfos || !isJson(data.toString())) return ;
		const msg: webMsg = JSON.parse(data.toString());
		switch (msg.type) {
			case "SameKeyboard" :
				handleSameKeyboard(playerInfos, msg);
				break ;
			case "Multi" :
				handleMulti(playerInfos, msg);
				break ;
			case "Solo" :
				handleSolo(playerInfos, msg);
				break ;
			case "Tournament" :
				handleTournament(playerInfos, msg);
				break ;
			case "Move" :
				handleMove(playerInfos, msg.value);
				break ;
			case "EXIT" :
				if (playerInfos.mode === "Multi") {
					playerInfos.resultMatch = "Loose"
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) 
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatch = "win"
					else 
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatch = "win"
				}
				else if (playerInfos.mode === "Tournament") {
					playerInfos.resultMatch = "Loose"
					if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
						playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: "win"}));
						playerInfos.game.getPlayer1().getPlayerInfos().resultMatchTournament = "Win"
					}
					else {
						playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "FINISHED", value: "win"}));
						playerInfos.game.getPlayer2().getPlayerInfos().resultMatchTournament = "Win"
					}
				}
				handleFinish(playerInfos);
				break ;
			case "Ping" :
				handlePing(playerInfos);
				break;
			case "Pause" :
				handlePause(playerInfos);
				break;
		}
	});
	socket.on('close', () => {
		const playerInfos = sockets.get(socket);
		console.log("close");
		if (playerInfos) handleClose(playerInfos);
		if ((playerInfos && playerInfos.mode === "Multi")|| (playerInfos && playerInfos.mode === "Tournament")) {
			if (playerInfos && playerInfos.game) {
				if (playerInfos.name !== playerInfos.game.getPlayer1().getPlayerInfos().name) {
					playerInfos.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true, message: "Adversaire en pause. Reprise imminente."}))
				}//if multi
				else {
					playerInfos.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({type: "Pause", value: true, message: "Adversaire en pause. Reprise imminente."}))
				}
			}
		}
	});
}