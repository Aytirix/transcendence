import { Game } from "./Game.js";
import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";
export function createGame() {
    const ball = new Ball(20, 271, 1, 0);
    const player1 = new Paddle(780, 250, "player1");
    const player2 = new Paddle(20, 250, "player2");
    const game = new Game(ball, player1, player2);
    return (game);
}
