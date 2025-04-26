import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { WebSocket,  RawData} from 'ws';
import { isJson } from "../server";


export class Game {
	constructor (
		private ball: Ball,
		private player1: Paddle,
		private player2: Paddle,
		private mode: "Multi" | "SameKeyboard" | "Solo",
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
		this.detectionCollision();
		this.jsonWebsocket = JSON.stringify({
			ball: this.ball,
			player1: this.player1,
			player2: this.player2
		});
		socket.send(this.jsonWebsocket);
		if (this.checkScore(this.player1, this.player2)) {
			return (true);
		}
		return (false);

		// this.draw();
	};
	detectionCollision(): void {
		if (this.player1.isCollidingWithBall(this.ball)) {
			this.ball.d_x = -1;
			this.player1.zoneEffect(this.ball);
		}
		else if ((this.ball.pos_x + this.ball.radius) >= this.width) {
			this.player1.setScore();
			this.serviceBall(0, this.ball);
		}
		else if (this.player2.isCollidingWithBall(this.ball)) {
			this.ball.d_x = 1;
			this.player2.zoneEffect(this.ball);
		}
		else if ((this.ball.pos_x - this.ball.radius) <= 0 ){
			this.player2.setScore();
			this.serviceBall(1, this.ball);
		}
		if ((this.ball.pos_y - this.ball.radius)<= 0) {
			this.ball.d_y = 1;
		}
		else if ((this.ball.pos_y  + this.ball.radius)>= this.height) {
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
					ball.d_y = 0; //a remettre a 0
					break;
				case 0 :
					ball.d_x = 1;
					ball.d_y = 0; // a remettre a zero
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
	handleMove(cmd: string, mode: string) {
		if (mode === "SameKeyboard") {
			if (cmd === "p1_up")
				this.player1.move("up");
			else if (cmd === "p1_down")	
				this.player1.move("down");
			else if (cmd === "p2_up")
				this.player2.move("up");
			else if (cmd === "p2_down")	
				this.player2.move("down");
		}
	}
	getJsonWebsocket() { return (this.jsonWebsocket); } 
	getStatus() : string { return (this.status); }
	getBall() : Ball {return (this.ball); }
	getPlayer1() : Paddle {return (this.player1); }
	getPlayer2() : Paddle {return (this.player2); }
	setStatus(stat: string) { this.status = stat; }
}
	// reset(): void{};
	// draw(): void{};
