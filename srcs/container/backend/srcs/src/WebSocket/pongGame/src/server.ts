
import { createGame } from './game/initGame'
import { Game } from './game/Game'
import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { Paddle } from './game/Paddle';

export interface playerStat {
	game?: Game;
	avatar?: string;
	email: string;
	name: string;
	id: number;
	mode?: "Multi" | "Solo" | "SameKeyboard" | "Tournois" | "Undefined" | "Move";
	inGame : boolean;
	socket: WebSocket;
};

export interface webMsg {
	type:  "Multi" | "Solo" | "SameKeyboard" | "Tournois" | "Undefined" | "Move";
	value?: string; 
};

const sockets = new Map<WebSocket, playerStat>();

export function pongWebSocket(socket: WebSocket, user: User) {
	const playerInfos: playerStat = {
		avatar: user.avatar,
		email: user.email,
		name: user.username,
		id: user.id,
		mode: "Undefined",
		inGame: false,
		socket: socket
	};
	sockets.set(socket, playerInfos);
	socket.on('message', (data: RawData) => {
		const playerInfos = sockets.get(socket);
		if (isJson(data.toString())) {
			const msg: webMsg = JSON.parse(data.toString()); 
			if (playerInfos) {
				if (msg.type === "SameKeyboard") {
					playerInfos.mode = msg.type;
					if (playerInfos.inGame === false) {
						playerInfos.inGame = true;
						playerInfos.game = createGame(playerInfos);
						playerInfos.game.start();
					}
				}
				else if (msg.type === "Multi") {
					playerInfos.mode = msg.type;
					for (const [playerSocket, player2Infos] of sockets) {
						if (player2Infos.mode === "Multi"
								&& player2Infos.inGame === false
								&& playerSocket !== socket) {
							playerInfos.inGame = true;
							player2Infos.inGame = true;
							const multiGame : Game = createGame(playerInfos, player2Infos);
							playerInfos.game = multiGame;
							player2Infos.game = multiGame;
							multiGame.start();
							break ;
						}
					}
					if (playerInfos.inGame === false)
					{
						console.log("en attente d un second joueur ");
					}
				}
				else if (msg.type === "Move") {
					playerInfos.game.handleMove(msg.value, playerInfos.mode);
				}		
			}
		}
	});
}

export function isJson(data: string) : boolean {
	try {
		JSON.parse(data);
		return (true);
	}
	catch {
		return false
	}
}