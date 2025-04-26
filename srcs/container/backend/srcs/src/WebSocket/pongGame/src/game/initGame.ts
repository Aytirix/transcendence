import { Game } from "./Game";
import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { WebSocket } from "ws";

export function createGame(mode: "Multi" | "SameKeyboard" | "Solo") : Game {
	const ball = new Ball(20, 271, 1, 0);
	const player1 = new Paddle(780, 250, "player1");
	const player2 = new Paddle(20, 250, "player2");
	const game: Game = new Game(ball, player1, player2, mode);
	return (game);
}