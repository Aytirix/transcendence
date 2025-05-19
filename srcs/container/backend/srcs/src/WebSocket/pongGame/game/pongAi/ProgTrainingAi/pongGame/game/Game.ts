import { writeFile } from "fs";
import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { join } from "path";

export class Game {
	constructor (
		private ball: Ball,
		private player1: Paddle,
		private player2: Paddle,
		private frameRate1: number = 0,
		private frameRate2: number = 0,
		private detectionPaddle: boolean = false,
		private readonly width: number = 800,
		private readonly height: number = 600,
		private status: "PLAYING" | "WAITING"| "KICKOFF" | "EXIT" = "PLAYING",
		private jsonWebsocket: string = "",
		private kickoffFrame: number = 0
	) {}
	start(): void{
		this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
		this.player1.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose

		this.player1.getAi().getStateFromGame(this.ball, this.player1, this.player2, 1); //capture du current etat au lancement du jeu 
		this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2, 2); //capture du current etat au lancement du jeu 

		this.player1.getAi().chooseAction(); //choix de l action initial au lancement du jeu et mise en previous de l etat current
		this.player2.getAi().chooseAction(); //choix de l action initial au lancement du jeu et mise en previous de l etat current
		while (!this.update()) {
		}
	};
	update(): boolean {
		if (this.status === "KICKOFF") {
			this.kickoffFrame++;
			if (this.kickoffFrame < 120) { //remise en service de 2 seconds apres but 
				return false; 
			}
			this.setStatus("PLAYING");
			this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
			this.player1.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose

			this.player1.getAi().getStateFromGame(this.ball, this.player1, this.player2, 1); //mise a jour du nouveau current
			this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2, 2); //mise a jour du nouveau current

			this.player1.getAi().chooseAction(); //choix de l action en fonction  du currentState et mise dans le previousstate le currentState
			this.player2.getAi().chooseAction(); //choix de l action en fonction  du currentState et mise dans le previousstate le currentState
		}

		this.ball.move();
		  
		this.detectionCollision();
		if (this.frameRate1 < this.player1.getAi().getLimitRate()) {
			if (this.player1.getAi().getPreviousState() === "TO_IA_POS_ZONE6_PRED_ZONE3" && this.player1.getAi().getAction() === "up") {
			}
			this.player1.move(this.player1.getAi().getAction());
			this.frameRate1++;
		}
		if (this.frameRate2 < this.player2.getAi().getLimitRate()) {
			this.player2.move(this.player2.getAi().getAction());
			this.frameRate2++;
		}
		this.detectionCollision();
		if (this.checkScore(this.player1, this.player2)) {
			this.player1.getAi().setCurrentState(""); //re initialisation de currenState
			this.player2.getAi().setCurrentState(""); //re initialisation de currenState

			this.player1.getAi().setPreviousState(""); // re initialisation previous state
			this.player2.getAi().setPreviousState(""); // re initialisation previous state
			return (true);
		}
		return (false);
	};
	detectionCollision(): void {
		if (this.player1.isCollidingWithBall(this.ball) && this.ball.d_x > 0) { //detection collision du cote player1 donc a droite et protection contre un rappel en trop avec ball > 0
			this.ball.d_x = -1; //balle part dans l autre sens 

			this.player1.zoneEffect(this.ball); //mise a jour donne orientation  ball

			this.player1.getAi().updateReward(4); //recompense de l action precedente choisis
			this.player2.getAi().updateReward(3); //recompense de l action precedente choisis
			
			this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
			this.player1.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
			
			this.player1.getAi().getStateFromGame(this.ball, this.player1, this.player2, 1); //mise a jour du nouveau current
			this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2, 2); //mise a jour du nouveau current

			this.player1.getAi().updateQtable(); // update de  la Qtable du previous avec son reward  avec le nouveau current
			this.player2.getAi().updateQtable(); // update de  la Qtable du previous avec son reward  avec le nouveau current

			
			this.frameRate1 = 0; //mise a zero des mouvements 
			this.frameRate2 = 0; // mise a zero des mouvements
			
			this.player1.getAi().chooseAction(); //choix de l action en fonction du  currentState et mise dans le previousstate le currentState 
			this.player2.getAi().chooseAction(); //choix de l action en fonction  du currentState et mise dans le previousstate le currentState

		}
		else if ((this.ball.pos_x - this.ball.radius) >= this.width && this.ball.d_x > 0 && this.status === "PLAYING"){ //but pour player 2 et securite playing

			this.player2.setScore(); //but du player augmente son score de 1
			
			this.player2.getAi().updateReward(1); //rewards player 2 marque un but reward positif 
			this.player1.getAi().updateReward(2); //rewards player 1 prend un but reward negatif

			this.player1.getAi().setCurrentState("KICKOFF"); //mise du current State a "kickoff" pour faire 0 dans updateqtable
			this.player2.getAi().setCurrentState("KICKOFF"); //mise du current State a "kickoff" pour faire 0 dans updateqtable

			this.player1.getAi().updateQtable(); //mise a jour de la qtable avec le reward le previous state et le current a zero car but
			this.player2.getAi().updateQtable(); //mise a jour de la qtable avec le reward le previous state et le current a zero car but

			this.frameRate1 = 0; //mise a zero des mouvements
			this.frameRate2 = 0; //mise a zero des mouvements
			
			this.kickoffFrame = 0; // remise a zero du frame pour les 2 seconde de service en kickoff partie du debut du code 

			this.serviceBall(1, this.ball); //initialisation centre du terrain paddle ball status a kickoff 
			
			this.player1.getAi().setCurrentState(""); //re initialisation de currenState
			this.player2.getAi().setCurrentState(""); //re initialisation de currenState

			this.player1.getAi().setPreviousState(""); // re initialisation previous state
			this.player2.getAi().setPreviousState(""); // re initialisation previous state
	
		}
		else if (this.player2.isCollidingWithBall(this.ball) && this.ball.d_x < 0){ //detection collision du cote player2 donc a droite et protection contre un rappel en trop avec ball > 0

			this.ball.d_x = 1;//balle part dans l autre sens 

			this.player2.zoneEffect(this.ball);//mise a jour donne orientation  ball
			
			this.player2.getAi().updateReward(4); //recompense de l action precedente choisis
			this.player1.getAi().updateReward(3); //recompense de l action precedente choisis
			
			this.player2.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose
			this.player1.getAi().getReboundBall(this.ball, this.player2, this.player1); //calcule de prediction arrive ball sens oppose

			this.player1.getAi().getStateFromGame(this.ball, this.player1, this.player2, 1); //mise a jour du nouveau current
			this.player2.getAi().getStateFromGame(this.ball, this.player1, this.player2, 2); //mise a jour du nouveau current

			this.player1.getAi().updateQtable(); // update de  la Qtable du previous avec son reward  avec le nouveau current
			this.player2.getAi().updateQtable(); // update de  la Qtable du previous avec son reward  avec le nouveau current

			this.frameRate1 = 0; //mise a zero des mouvements
			this.frameRate2 = 0; //mise a zero des mouvements
			
			this.player1.getAi().chooseAction(); //choix de l action en fonction du  currentState et mise dans le previousstate le currentState
			this.player2.getAi().chooseAction(); //choix de l action en fonction du  currentState et mise dans le previousstate le currentState
		}
		else if ((this.ball.pos_x + this.ball.radius) <= 0 && this.ball.d_x < 0 && this.status === "PLAYING") {

			this.player1.setScore();

			this.player2.getAi().updateReward(2); //rewards player 2 prend un but reward negatif 
			this.player1.getAi().updateReward(1); //rewards player 1 marque un but reward positif
			
			this.player1.getAi().setCurrentState("KICKOFF"); //mise du current State a "kickoff" pour faire 0 dans updateqtable
			this.player2.getAi().setCurrentState("KICKOFF"); //mise du current State a "kickoff" pour faire 0 dans updateqtable

			this.player1.getAi().updateQtable(); //mise a jour de la qtable avec le reward le previous state et le current a zero car but
			this.player2.getAi().updateQtable(); //mise a jour de la qtable avec le reward le previous state et le current a zero car but
			
			this.frameRate1 = 0; //mise a zero des mouvements
			this.frameRate2 = 0; //mise a zero des mouvements

			this.kickoffFrame = 0; // remise a zero du frame pour les 2 seconde de service en kickoff partie du debut du code 
			
			this.serviceBall(0, this.ball); //initialisation centre du terrain paddle ball status a kickoff 

			this.player1.getAi().setCurrentState(""); //re initialisation de currenState
			this.player2.getAi().setCurrentState(""); //re initialisation de currenState

			this.player1.getAi().setPreviousState(""); // re initialisation previous state
			this.player2.getAi().setPreviousState(""); // re initialisation previous state
			
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
		this.setStatus("KICKOFF");
		let random: number = Math.random();
		if (random < 0.5)
			random = -1;
		else
			random = 1;
		switch (direction) {
			case 1 :
				ball.d_x = random;
				ball.d_y = 0;
				break;
			case 0 :
				ball.d_x = random;
				ball.d_y = 0;
				break;
		}
	}
	checkScore(player1: Paddle, player2: Paddle) : boolean {
		if (player1.getScore() == 23) {
			this.status = "EXIT";
			return (true);
		}
		else if (player2.getScore() == 23){
			this.status = "EXIT";
			return (true);
		}
		return (false)
	}
	getJsonWebsocket() { return (this.jsonWebsocket); } 
	getStatus() : string { return (this.status); }
	getBall() : Ball {return (this.ball); }
	getPlayer1() : Paddle {return (this.player1); }
	getPlayer2() : Paddle {return (this.player2); }
	setStatus(stat: "PLAYING" | "WAITING" | "EXIT" | "KICKOFF") { this.status = stat; }
}