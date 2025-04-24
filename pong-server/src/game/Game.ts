import { Ball } from "./Ball.js";
import { Paddle } from "./Paddle.js";

export class Game {
	constructor (
		private ball: Ball,
		private player1: Paddle,
		private player2: Paddle,
		private readonly width: number = 800,
		private readonly height: number = 600,
		private status: string = "playing",
		private jsonWebsocket: string = ""
	) {}
	start(ball: Ball, socket: WebSocket): void{
		const idInterval = setInterval(() => {

			if (this.update(ball, socket))
				clearInterval(idInterval);
		}, 1000 / 60)
	};
	update(ball: Ball, socket: WebSocket): boolean{
		if (this.getStatus() === "WAITING") { return false }
		this.ball.move();
		this.player1.move();
		this.player2.move();
		this.detectionCollision();
		this.jsonWebsocket = JSON.stringify({
			ball: this.ball,
			player1: this.player1,
			player2: this.player2
		});
		socket.send(this.jsonWebsocket); //envoi du websocket en direct

		if (this.checkScore(this.player1, this.player2)) {
			return (true);
		}
		return (false);

		// this.draw();
	};
	detectionCollision(): void {
		if (this.player1.isCollidingWithBall(this.ball)) {
			console.log("REBOND droit ", this.ball.pos_x);
			this.ball.d_x = -1;
			this.player1.zoneEffect(this.ball);
		}
		else if ((this.ball.pos_x + this.ball.radius) >= this.width) {
			console.log("REBOND droit ", this.ball.pos_x);
			this.player1.setScore();
			console.log(`${this.player1.setUsername()} : score ${this.player1.getScore()}`);
			console.log(`${this.player2.setUsername()} : score ${this.player2.getScore()}`);
			this.serviceBall(0, this.ball);
		}
		else if (this.player2.isCollidingWithBall(this.ball)) {
			console.log("REBOND gauche ", this.ball.pos_x);
			this.ball.d_x = 1;
			this.player2.zoneEffect(this.ball);
		}
		else if ((this.ball.pos_x - this.ball.radius) <= 0 ){
			console.log("REBOND gauche ", this.ball.pos_x);
			this.player2.setScore();
			console.log(`${this.player2.setUsername()} : score ${this.player2.getScore()}`);
			console.log(`${this.player1.setUsername()} : score ${this.player1.getScore()}`);
			this.serviceBall(1, this.ball);
		}
		if ((this.ball.pos_y - this.ball.radius)<= 0) {
			console.log("REBOND haut ", this.ball.pos_y);
			this.ball.d_y = 1;
		}
		else if ((this.ball.pos_y  + this.ball.radius)>= this.height) {
			console.log("REBOND BAS ", this.ball.pos_y);
			this.ball.d_y = -1;
		}
	}
	serviceBall(direction: number, ball: Ball) : void {
		ball.pos_x = this.width / 2;
		ball.pos_y = this.height / 2;
		this.setStatus("WAITING");
		console.log("Service dans 2 sec");

		setTimeout(() => {
			switch (direction) {
				case 1 :
					ball.d_x = -1;
					ball.d_y = 0.50; //a remettre a 0
					break;
				case 0 :
					ball.d_x = 1;
					ball.d_y = 0.50; // a remettre a zero
					break;
			}
			this.setStatus("PLAYING");
		}, 2000);
	}
	checkScore(player1: Paddle, player2: Paddle) : boolean {
		if (player1.getScore() == 21) {
			console.log("Winner is player 2")
			return (true);
		}
		else if (player2.getScore() == 21){
			console.log("Winner is player 2")
			return (true);
		}
		return (false)
	}
	getJsonWebsocket() { return (this.jsonWebsocket); } 
	getStatus() : string { return (this.status); }
	getBall() : Ball {return (this.ball); }
	setStatus(stat: string) { this.status = stat; }
}
	// reset(): void{};
	// draw(): void{};
