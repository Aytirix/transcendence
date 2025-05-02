import { Ball } from "../Ball";
import { Game } from "../Game";
import { Paddle } from "../Paddle";


export interface qTable {
	[key: string]: [number, number, number];
};

let qTable: qTable = {
	["UP_UP"]: [0, 0, 0],
	["UP_CENTER"]: [0, 0, 0],
	["UP_DOWN"]: [0, 0, 0],
	["CENTER_UP"]: [0, 0, 0],
	["CENTER_CENTER"]: [0, 0, 0],
	["CENTER_DOWN"]: [0, 0, 0],
	["DOWN_UP"]: [0, 0, 0],
	["DOWN_CENTER"]: [0, 0, 0],
	["DOWN_DOWN"]: [0, 0, 0],
};
export class ai {
	constructor (
		public alpha: number,
		public epsilon: number,
		public gamma: number,
		public qTable: qTable,
	) {}
	getStateFromGame(ball: Ball, paddle: Paddle)
	{
		const ballUp: boolean = (ball.pos_y + ball.radius) < paddle.pos_y;
		const ballCenter: boolean = (ball.pos_y + ball.radius) > (paddle.pos_y + (paddle.height / 2 - 10))
								&& (ball.pos_y + ball.radius) < (paddle.pos_y + (paddle.height / 2 + 10));
		const ballDown: boolean = (ball.pos_y + ball.radius) > paddle.pos_y + paddle.height
		const ballDirUp: boolean = ball.d_y < 0;
		const ballDirCentral: boolean = ball.d_y == 0;
		const ballDirDown: boolean = ball.d_y > 0;

		let move: string = "CENTER";
		if (ballUp) {move = "UP"}
		else if (ballCenter) {move = "CENTER"}
		else if (ballDown) {move = "DOWN"}
		if (ballDirUp) return (`${move}_UP`);
		else if (ballDirCentral) return (`${move}_CENTER`);
		else if (ballDirDown) return (`${move}_DOWN`);
	}
}