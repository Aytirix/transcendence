
import { createGame } from './game/initGame'
import { Game } from './game/Game'
import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { Paddle } from './game/Paddle';

interface playerStat {
	game?: Game;
	avatar?: string;
	email: string;
	name: string;
	id: number;
	mode?: "Multi" | "Solo" | "SameKeyboard" | "Tournois" | "Undefined" | "Move";
	inGame : boolean;
};

interface webMsg {
	type:  "Multi" | "Solo" | "SameKeyboard" | "Tournois" | "Undefined" | "Move";
	value?: string; 
};


export function pongWebSocket(socket: WebSocket, user: User) {
	const sockets = new Map<WebSocket, playerStat>();
	const playerstat: playerStat = {
		avatar: user.avatar,
		email: user.email,
		name: user.username,
		id: user.id,
		mode: "Undefined",
		inGame: false
	};
	sockets.set(socket, playerstat);
	socket.on('message', (data: RawData) => {
		const player = sockets.get(socket);
		if (isJson(data.toString())) {
			const msg: webMsg = JSON.parse(data.toString()); 
			if (player) {
				if (msg.type === "SameKeyboard") {
					player.mode = msg.type;
					if (player.inGame === false) {
						player.inGame = true;
						player.game = createGame(player.mode);
						player.game.start(player.game.getBall(), socket);
					}
				}
				else if (msg.type === "Multi") {
					
				}
				else if (msg.type === "Move") {
					player.game.handleMove(msg.value, player.mode);
				}
			}
		}
	})
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