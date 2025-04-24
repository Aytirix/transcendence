"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Game_1 = require("./Game");
const Ball_1 = require("./Ball");
const Paddle_1 = require("./Paddle");
// export function createGame() : Game {
const ball = new Ball_1.Ball(20, 271, 1, 0);
const player1 = new Paddle_1.Paddle(780, 250, "player1");
const player2 = new Paddle_1.Paddle(20, 250, "player2");
const game = new Game_1.Game(ball, player1, player2);
// 	return (game);
// }
game.start(game.getBall());
