import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { WebSocket,  RawData} from 'ws';
import { playerStat } from "../server";
import { isJson } from "../server";


export class Game {
	constructor (
		private ball: Ball,
		private player1: Paddle,
		private player2: Paddle,
		// private mode: "Multi" | "SameKeyboard" | "Solo",
		private readonly width: number = 800,
		private readonly height: number = 600,
		private status: "PLAYING" | "WAITING" = "PLAYING",
		private jsonWebsocket: string = ""
	) {}
	start(): void{
		const idInterval = setInterval(() => {
			if (this.update())
				clearInterval(idInterval);
		}, 1000 / 60)
	};
	update(): boolean{
		if (this.getStatus() === "WAITING") { return false }
		this.ball.move();
		this.detectionCollision();
		this.jsonWebsocket = JSON.stringify({
			ball: {
				pos_x: this.ball.pos_x,
				pos_y: this.ball.pos_y,
				d_x: this.ball.d_x,
				d_y: this.ball.d_y,
				speed: this.ball.speed,
				radius: this.ball.radius
			},
			player1: {
				pos_x: this.player1.pos_x,
				pos_y: this.player1.pos_y,
				height: this.player1.height,
				width: this.player1.width,
				margin: this.player1.margin,
				speed: this.player1.speed,
				score: this.player1.getScore()
			},
			player2: {
				pos_x: this.player2.pos_x,
				pos_y: this.player2.pos_y,
				height: this.player2.height,
				width: this.player2.width,
				margin: this.player2.margin,
				speed: this.player2.speed,
				score: this.player2.getScore()
			}
		});
		if (this.player1.getPlayerInfos().mode === "Multi"
			&& this.player2.getPlayerInfos().mode === "Multi") {
				this.player1.getPlayerInfos().socket.send(this.jsonWebsocket);
				this.player2.getPlayerInfos().socket.send(this.jsonWebsocket);
			}
		else
			this.player1.getPlayerInfos().socket.send(this.jsonWebsocket);
		if (this.checkScore(this.player1, this.player2)) {
			return (true);
		}
		return (false);
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
		this.player1.pos_x = 780;
		this.player1.pos_y = 250;
		this.player2.pos_x = 20;
		this.player2.pos_y = 250;
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
		if (mode === "SameKeyboard" && this.getStatus() === "PLAYING") {
			if (cmd === "p1_up")
				this.player1.move("up");
			else if (cmd === "p1_down")	
				this.player1.move("down");
			else if (cmd === "p2_up")
				this.player2.move("up");
			else if (cmd === "p2_down")	
				this.player2.move("down");
		}		
		else if (mode === "Multi" && this.getStatus() === "PLAYING") {
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
	setStatus(stat: "PLAYING" | "WAITING") { this.status = stat; }
}
	// reset(): void{};
	// draw(): void{};
