import { writeFile } from "fs";
import { handleFinish } from "../handlers/handleFinish";
import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { join } from "path";
import { handleCollisionWithPlayer1, handleCollisionWithPlayer2, handleScorePlayer1, handleScorePlayer2 } from "../handlers/handleSolo";
import { Tournament } from "../types/playerStat";
import { isOnFinishMatch } from "../handlers/handleTournament";

export class Game {
	constructor (
		private ball: Ball,
		private player1: Paddle,
		private player2: Paddle,
		private frameRate: number = 0,
		private detectionPaddle: boolean = false,
		private readonly width: number = 800,
		private readonly height: number = 600,
		private status: "PLAYING" | "KICKOFF" | "EXIT" = "PLAYING",
		private jsonWebsocket: string = "",
		private tournament?: Tournament,
	) {}
	start(): void{
		let i: number = 0;
		while (i < 1 && this.player1.getPlayerInfos().mode === "Solo") {
			this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
			this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2); //capture du current etat au lancement du jeu 
			this.player2.getAi().chooseAction(); //choix de l action initial au lancement du jeu et mise en previous de l etat current
			i++;
		}
		const idInterval = setInterval(() => {
			if (this.update())
				clearInterval(idInterval);
		}, 1000 / 60)
	}
	update(): boolean {
		this.frameRate++;
		if (this.getStatus() === "KICKOFF") { return false }
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
		else if (this.player1.getPlayerInfos().mode === "Tournament"
			&& this.player2.getPlayerInfos().mode === "Tournament") {
				this.player1.getPlayerInfos().socket.send(this.jsonWebsocket);
				this.player2.getPlayerInfos().socket.send(this.jsonWebsocket);
			}
		else if (this.player1.getPlayerInfos().mode === "SameKeyboard")
			this.player1.getPlayerInfos().socket.send(this.jsonWebsocket);
		else if (this.player1.getPlayerInfos().mode === "Solo") {
			this.player1.getPlayerInfos().socket.send(this.jsonWebsocket);
			if (this.frameRate < this.player2.getAi().getLimitRate())
				this.player2.move(this.player2.getAi().getAction());
		}
		if (this.checkScore(this.player1, this.player2)) {
			if (this.player1.getPlayerInfos().mode === "Multi"
			&& this.player2.getPlayerInfos().mode === "Multi") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				this.player2.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos())
				handleFinish(this.player2.getPlayerInfos())
				this.resetDisplay("Multi");
			}
			else if (this.player1.getPlayerInfos().mode === "Tournament"
			&& this.player2.getPlayerInfos().mode === "Tournament") {
				isOnFinishMatch(this.tournament, this.player1.getPlayerInfos(), this.player2.getPlayerInfos());
				//determiner le finish du tournois en fonction des manche
				//gerer l actualisation la deco et surtout le exit du tournois 
			}
			else if (this.player1.getPlayerInfos().mode === "SameKeyboard") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos());
				this.resetDisplay("SameKeyboard");
			}
			else if (this.player1.getPlayerInfos().mode === "Solo") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos());
				this.resetDisplay("Solo");
			}
			return (true);
		}
		if (this.getStatus() === "EXIT") {
			if (this.player1.getPlayerInfos().mode === "Multi"
			&& this.player2.getPlayerInfos().mode === "Multi") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				this.player2.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos());
				handleFinish(this.player2.getPlayerInfos());
				this.resetDisplay("Multi");
			}
			else if (this.player1.getPlayerInfos().mode === "SameKeyboard") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos());
				this.resetDisplay("SameKeyboard");
			}
			else if (this.player1.getPlayerInfos().mode === "Solo") {
				this.player1.getPlayerInfos().socket.send(JSON.stringify({type: "EXIT"}));
				handleFinish(this.player1.getPlayerInfos());
				this.resetDisplay("Solo");
			}
			return (true);
		}
		return (false);
	};
	detectionCollision(): void {
		if (this.player1.isCollidingWithBall(this.ball)) {
			this.ball.d_x = -1;
			if (this.ball.speed <= 12.5)
				this.ball.speed += 0.5;
			this.player1.zoneEffect(this.ball);
			if (this.player1.getPlayerInfos().mode === "Solo")
				handleCollisionWithPlayer1(this.ball, this.player1, this.player2, this)
		}
		else if ((this.ball.pos_x + this.ball.radius) <= 0) {
			this.player1.setScore();
			if (this.player1.getPlayerInfos().mode === "Solo")
				handleScorePlayer1(this.ball, this.player1, this.player2, this)
			else
				this.serviceBall(0, this.ball, this.player1, this.player2);
		}
		else if (this.player2.isCollidingWithBall(this.ball)) {
			this.ball.d_x = 1;
			if (this.ball.speed <= 12.5)
				this.ball.speed += 0.5;
			this.player2.zoneEffect(this.ball);
			if (this.player1.getPlayerInfos().mode === "Solo") 
				handleCollisionWithPlayer2(this.ball, this.player1, this.player2, this);
		}
		else if ((this.ball.pos_x - this.ball.radius) >= this.width){
			this.player2.setScore();

			if (this.player1.getPlayerInfos().mode === "Solo")
				handleScorePlayer2(this.ball, this.player1, this.player2, this)
			else
				this.serviceBall(1, this.ball, this.player1, this.player2);
		}
		if ((this.ball.pos_y - this.ball.radius)<= 0) {
			this.ball.d_y = 1;
		}
		else if ((this.ball.pos_y  + this.ball.radius)>= this.height) {
			this.ball.d_y = -1;
		}
	}
	serviceBall(direction: number, ball: Ball, player1: Paddle, player2: Paddle) : void {
		ball.pos_x = this.width / 2;
		ball.pos_y = this.height / 2;
		ball.speed = 7 //ici enlever
		player1.pos_x = 780;
		player1.pos_y = 250;
		player2.pos_x = 20;
		player2.pos_y = 250;
		this.setStatus("KICKOFF");
		setTimeout(() => {
			switch (direction) {
				case 1 :
					ball.d_x = -1;
					ball.d_y = 0;
					break;
				case 0 :
					ball.d_x = 1;
					ball.d_y = 0;
					break;
			}
		}, 1000); //2000
		setTimeout(() => {
			this.setStatus("PLAYING");
			if (player1.getPlayerInfos().mode === "Solo") {
				this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
				this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2); //mise a jour du nouveau current
				this.player2.getAi().chooseAction(); //choix de l action en fonction  du currentState et mise dans le previousstate le currentState
			}
		}, 1000); //2000
	}
	checkScore(player1: Paddle, player2: Paddle) : boolean {
		if (player1.getScore() == 21) {
			if (player1.getPlayerInfos().mode === "Tournament") {
				player1.getPlayerInfos().resultMatchTournament = "Win";
				player2.getPlayerInfos().resultMatchTournament = "Loose";
			}
			console.log("Winner is player 1")
			return (true);
		}
		else if (player2.getScore() == 21){
			if (player1.getPlayerInfos().mode === "Tournament") {
				player2.getPlayerInfos().resultMatchTournament = "Win";
				player1.getPlayerInfos().resultMatchTournament = "Loose";
			}
			console.log("Winner is player 2")
			return (true);
		}
		return (false)
	}
	resetDisplay(msg: string) {
		if (msg === "SameKeyboard")
			this.player1.getPlayerInfos().socket.send(JSON.stringify({ type: "reset" }));
		else if (msg === "Multi") {
			this.player1.getPlayerInfos().socket.send(JSON.stringify({ type: "reset" }));
			this.player2.getPlayerInfos().socket.send(JSON.stringify({ type: "reset" }));
		}
		else if (msg === "Solo")
			this.player1.getPlayerInfos().socket.send(JSON.stringify({ type: "reset" }));
	}
	getJsonWebsocket() { return (this.jsonWebsocket); } 
	getStatus() : string { return (this.status); }
	getBall() : Ball {return (this.ball); }
	getPlayer1() : Paddle {return (this.player1); }
	getPlayer2() : Paddle {return (this.player2); }
	setStatus(stat: "PLAYING" | "KICKOFF" | "EXIT") { this.status = stat; }
	setFramerate(frameRate: number) { this.frameRate = frameRate; }
	setTournament(tournament: Tournament) { this.tournament = tournament; }
}