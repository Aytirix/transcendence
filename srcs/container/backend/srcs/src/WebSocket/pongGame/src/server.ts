
import { createGame } from './game/initGame'
import { Game } from './game/Game'
import { WebSocketServer, WebSocket } from 'ws'
import { User } from '@types'


export function pongWebSocket(server: WebSocketServer, socket: WebSocket, user: User) {
	const game: Game = createGame();
	game.start(game.getBall(), socket);
}