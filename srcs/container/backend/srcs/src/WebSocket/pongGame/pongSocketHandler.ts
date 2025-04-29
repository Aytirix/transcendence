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

export let pingMonitoring: boolean;

export function pongWebSocket(socket: WebSocket, user: User) {
	if (waitingID.has(user.id))
	{
		const tempPlayer = waitingID.get(user.id);
		sockets.delete(tempPlayer.socket);
		tempPlayer.socket = socket;
		sockets.set(socket, tempPlayer);
		waitingID.delete(user.id);
		tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
		tempPlayer.game.setStatus("PLAYING");
	}
	else {
		const playerInfos: playerStat = {
				avatar: user.avatar,
				email: user.email,
				name: user.username,
				id: user.id,
				mode: "Undefined",
				inGame: false,
				socket: socket,
				lastping: Date.now()
			};
			sockets.set(socket, playerInfos);
	}
	if (!pingMonitoring) startingPing(sockets);
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
				break ;
			case "Tournament" :
				break ;
			case "Move" :
				handleMove(playerInfos, msg.value);
				break ;
			case "EXIT" :
				// handleFinish();
				break ;
			case "Ping" :
				handlePing(playerInfos);
				break;
		}
	});
	socket.on('close', (data: RawData) => {
		const playerInfos = sockets.get(socket);
		handleClose(playerInfos);
	});
}




// import { createGame } from './game/initGame'
// import { Game } from './game/Game'
// import { WebSocket, RawData } from 'ws'
// import { User } from '@types'
// import { playerStat } from './types/playerStat';
// import { webMsg } from './types/webMsg';
// import { isJson } from './utils/isJson';
// import { sockets, waitingID } from './state/serverState';



// export function pongWebSocket(socket: WebSocket, user: User) {
// 	if (waitingID.has(user.id))
// 	{
// 		const tempPlayer = waitingID.get(user.id);
// 		sockets.delete(tempPlayer.socket);
// 		tempPlayer.socket = socket;
// 		sockets.set(socket, tempPlayer);
// 		waitingID.delete(user.id);
// 		tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
// 		tempPlayer.game.setStatus("PLAYING");
// 	}
// 	else {
// 		const playerInfos: playerStat = {
// 			avatar: user.avatar,
// 			email: user.email,
// 			name: user.username,
// 			id: user.id,
// 			mode: "Undefined",
// 			inGame: false,
// 			socket: socket
// 		};
// 		sockets.set(socket, playerInfos);
// 	}
// 	socket.on('message', (data: RawData) => {
// 		const playerInfos = sockets.get(socket);
// 		if (isJson(data.toString())) {
// 			const msg: webMsg = JSON.parse(data.toString()); 
// 			if (playerInfos) {
// 				if (msg.type === "SameKeyboard") {
// 					playerInfos.mode = msg.type;
// 					if (playerInfos.inGame === false) {
// 						playerInfos.inGame = true;
// 						playerInfos.game = createGame(playerInfos);
// 						playerInfos.game.start();
// 					}
// 					socket.on('close', (data: RawData) => {
// 						playerInfos.game.setStatus("WAITING")
// 						console.log("TEST TEST");
// 						waitingID.set(playerInfos.id, playerInfos);
// 					})
// 				}
// 				else if (msg.type === "Multi") {
// 					playerInfos.mode = msg.type;
// 					for (const [playerSocket, player2Infos] of sockets) {
// 						if (player2Infos.mode === "Multi"
// 								&& player2Infos.inGame === false
// 								&& playerSocket !== socket) {
// 							playerInfos.inGame = true;
// 							player2Infos.inGame = true;
// 							const multiGame : Game = createGame(playerInfos, player2Infos);
// 							playerInfos.game = multiGame;
// 							player2Infos.game = multiGame;
// 							multiGame.start();
// 							break ;
// 						}
// 					}
// 					if (playerInfos.inGame === false)
// 					{
// 						console.log("en attente d un second joueur ");
// 					}
// 				}
// 				else if (msg.type === "Move") {
// 					playerInfos.game.handleMove(msg.value, playerInfos.mode);
// 				}
// 				if (msg.type === "EXIT") {
// 						playerInfos.game.setStatus("EXIT");
// 						playerInfos.inGame = false;
// 				}	
// 			}
// 		}
// 	});
// }
