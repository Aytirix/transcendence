import { readFileSync } from "fs";
import { Ball } from "../Ball";
import { Game } from "../Game";
import { Paddle } from "../Paddle";
import { join } from "path";
import dotenv from 'dotenv';

dotenv.config();
const BACKEND_PATH = process.env.BACKEND_PATH;
if (!BACKEND_PATH) {
  throw new Error("BACKEND_PATH environment variable is not set.");
}
const qLearningPath = join(BACKEND_PATH, 'pongAi', 'qLearning.json');
const qLearningPath2 = join(BACKEND_PATH, 'pongAi', 'qLearning2.json');

export interface QTable {
	[key: string]: [number, number , number, number, number, number, number, number, number];
}; 

export function qTableConstructor() : QTable {
	const qtable: QTable = {};
	const SENS: string[] = ["TO_IA", "TO_OPPONENT"];
	const POS:string[] = ["POS_ZONE1", "POS_ZONE2", "POS_ZONE3", "POS_ZONE4", "POS_ZONE5", "POS_ZONE6"];
	const ZONE:string[] = ["PRED_ZONE1", "PRED_ZONE2", "PRED_ZONE3", "PRED_ZONE4", "PRED_ZONE5", "PRED_ZONE6"];
		for (const sens of SENS) {
					for(const pos of POS) {
						for (const zone of ZONE) {
								const key = `${sens}_${pos}_${zone}`;
								qtable[key] = [0, 0, 0, 0, 0, 0, 0, 0, 0]; 
						}
					}
		}
	qtable["KICKOFF"] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	
	return (qtable);
}
export class Ai {
	constructor (
		public alpha: number, 
		public epsilon: number,
		public gamma: number, 
		public json2: boolean,
		public qTable: QTable = qTableConstructor(),

		private reward: number = 0,
		private limitFrameRate: number = 0,
		private Action: "up" | "center" | "down" | "undefined" = "undefined",
		private predPosBall: number = 0,
		private currentState: string = "",
		private previousState: string = "",
		private previousIndex: number = 0,
		private currentIndex: number = 0,
	) {
		if (this.json2 === false) {
			try {
				const filePath = qLearningPath2;
				const jsonString = readFileSync(filePath, 'utf8');
				this.qTable = JSON.parse(jsonString);
			} catch (err) {
				console.warn("⚠️ Aucune Q-table chargée, IA démarre à zéro.");
				this.qTable = qTableConstructor();
			}
		}
		else if (this.json2 === true) {
			try {
				const filePath = qLearningPath;
				const jsonString = readFileSync(filePath, 'utf8');
				this.qTable = JSON.parse(jsonString);
			} catch (err) {
				console.warn("⚠️ Aucune Q-table chargée, IA démarre à zéro.");
				this.qTable = qTableConstructor();
			}
		}
	}
	getStateFromGame(ball: Ball, player1: Paddle ,player2: Paddle, inter: number)
	{
		if (inter === 1) {
			let sens: "TO_IA" | "TO_OPPONENT" = "TO_IA";
			let pos_zone: "POS_ZONE1" | "POS_ZONE2" | "POS_ZONE3" | "POS_ZONE4" | "POS_ZONE5" | "POS_ZONE6";
			let pre_zone: "PRED_ZONE1" | "PRED_ZONE2" | "PRED_ZONE3" | "PRED_ZONE4" | "PRED_ZONE5" | "PRED_ZONE6";
			
			if (player1.getPlayerInfos().game?.getStatus() === "KICKOFF") {
				this.currentState = "KICKOFF";
				return ;
			}
			
			if (ball.d_x > 0) sens = "TO_IA";
			else if (ball.d_x < 0) sens = "TO_OPPONENT";
			if (sens === "TO_OPPONENT") {
				pre_zone = this.getPredictionZone(player2);
				pos_zone = this.getPositionPlayer(player2, ball);
			}
			else {
				pre_zone = this.getPredictionZone(player1);
				pos_zone = this.getPositionPlayer(player1, ball);
			}
			
			this.limitMove(player1);
			this.currentState = `${sens}_${pos_zone}_${pre_zone}`;
		}
		if (inter === 2) {
			let sens: "TO_IA" | "TO_OPPONENT" = "TO_IA";
			let pos_zone: "POS_ZONE1" | "POS_ZONE2" | "POS_ZONE3" | "POS_ZONE4" | "POS_ZONE5" | "POS_ZONE6";
			let pre_zone: "PRED_ZONE1" | "PRED_ZONE2" | "PRED_ZONE3" | "PRED_ZONE4" | "PRED_ZONE5" | "PRED_ZONE6";
			if (player2.getPlayerInfos().game?.getStatus() === "KICKOFF") {
				this.currentState = "KICKOFF";
				return ;
			}
			if (ball.d_x > 0) sens = "TO_OPPONENT";
			else if (ball.d_x < 0) sens = "TO_IA";
					
			if (sens === "TO_OPPONENT") {
				pre_zone = this.getPredictionZone(player1);
				pos_zone = this.getPositionPlayer(player1, ball);
			}
			else {
				pre_zone = this.getPredictionZone(player2);
				pos_zone = this.getPositionPlayer(player2, ball);
			}
			this.limitMove(player2);
			this.currentState = `${sens}_${pos_zone}_${pre_zone}`;
		}
	}
	getPredictionZone(player: Paddle): "PRED_ZONE1" | "PRED_ZONE2" | "PRED_ZONE3" | "PRED_ZONE4" | "PRED_ZONE5" | "PRED_ZONE6"{
		if (this.predPosBall <= 100)
			return ("PRED_ZONE1")
		else if (this.predPosBall <= 200)
			return ("PRED_ZONE2")
		else if (this.predPosBall <= 300)
			return ("PRED_ZONE3")
		else if (this.predPosBall <= 400)
			return ("PRED_ZONE4")
		else if (this.predPosBall <= 500)
			return ("PRED_ZONE5")
		else
			return ("PRED_ZONE6")
	}
	getPositionPlayer(player: Paddle, ball:Ball) : "POS_ZONE1" | "POS_ZONE2" | "POS_ZONE3" | "POS_ZONE4" | "POS_ZONE5" | "POS_ZONE6" {
		if (player.pos_y <= 100)
			return ("POS_ZONE1")
		else if (player.pos_y <= 200)
			return ("POS_ZONE2")
		else if (player.pos_y <= 300)
			return ("POS_ZONE3")
		else if (player.pos_y <= 400)
			return ("POS_ZONE4")
		else if (player.pos_y <= 500)
			return ("POS_ZONE5")
		else
			return ("POS_ZONE6")
	}
	chooseAction() {
		const array: ["up", "center", "down"] = [
			"up", "center", "down"
		]
		const action = this.qTable[this.currentState];
		if (this.epsilon < Math.random()) {
			const value = Math.max(...action);
			this.currentIndex = action.indexOf(value);
		}
		else
			this.currentIndex = Math.floor(Math.random() * 9);
		if (this.currentIndex === 0
			|| this.currentIndex === 3
			|| this.currentIndex === 6)
				this.limitFrameRate -= (Math.floor(Math.random() * 41) / 5); 
		else if (this.currentIndex === 1
			|| this.currentIndex === 4
			|| this.currentIndex === 7)
				this.limitFrameRate += 0;
		else if (this.currentIndex === 2
			|| this.currentIndex === 5
			|| this.currentIndex === 8)
				this.limitFrameRate +=  (Math.floor((Math.random() * (100 - 61 + 1)) + 61) / 5)
		if (this.currentIndex <= 2)
			this.Action = array[0];
		else if (this.currentIndex <= 5)
			this.Action = array[1]
		else if (this.currentIndex <= 8)
			this.Action = array[2];
		this.previousIndex = this.currentIndex;
		this.previousState = this.currentState;
		this.limitFrameRate = Math.abs(this.limitFrameRate)
	}
	updateReward(reward: number) {
		switch (reward) {
			case 1:
				this.reward += 2; // but pour moi
				break;
			case 2:
				this.reward += -2; // but pour l’adversaire
				break;
			case 3:
				this.reward += -0.3; // l’adversaire touche
				break;
			case 4:
				this.reward += 1; // interception 
				break;
			case 5:
				this.reward += 0.05; // si rien ne se passe 
				break;
			}
	}
	updateQtable() {
		const maxNext = this.currentState === "KICKOFF"
			? 0
			: Math.max(...this.qTable[this.currentState]);
		// Q-learning update: Q(s, a) ← Q(s, a) + α × (r + γ × max(Q(s')) - Q(s, a))
		const qPrev = this.qTable[this.previousState][this.previousIndex];
		this.qTable[this.previousState][this.previousIndex] =
			qPrev + this.alpha * (this.reward + this.gamma * maxNext - qPrev);
		this.reward = 0;
	}
	limitMove(paddle: Paddle) {
		let len: number = 0;
		if (this.predPosBall < 550 && this.predPosBall > 50) {
			len = Math.abs((paddle.pos_y + 50) - this.predPosBall);
		}
		else if (this.predPosBall <= 50 || this.predPosBall >= 550)
			len = Math.abs(paddle.pos_y - this.predPosBall);
		this.limitFrameRate = (len  / 5);
	}
	getReboundBall(ball: Ball, paddleLeft: Paddle, paddleRight: Paddle): void {
		let TempX: number = ball.pos_x;
		let TempY: number = ball.pos_y;
		let TempDx: number = ball.d_x;
		let TempDy: number = ball.d_y;

		while (TempX > 0 && TempX < 800) {
			TempX += TempDx * ball.speed;
			if (TempY >= 0 && TempY <= 600) {
				TempY += TempDy * ball.speed;
			}
			else {
				if (TempY < 0) {
					TempDy = 1;
					TempY = 0;
				}
				else {
					TempDy = -1;
					TempY = 600;
				}
			}
		}
		this.predPosBall = TempY;
	}
	getLimitRate(): number { return (this.limitFrameRate) ;}
	getAction(): string { return this.Action; }
	getReward(): number {return this.reward}
	setReward(Reward: number) {this.reward = Reward}
	setCurrentState(currentState: string) {this.currentState = currentState}
	setPreviousState(previousState: string) {this.previousState = previousState}
	getQtable(): QTable { return (this.qTable); }
	getCurrentState(): string { return this.currentState; }
	getPreviousState(): string {return this.previousState}
	getPreviousIndex(): number {return this.previousIndex}
}
