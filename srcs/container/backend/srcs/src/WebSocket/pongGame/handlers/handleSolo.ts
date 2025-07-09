import { playerStat } from "../types/playerStat";
import { webMsg } from "../types/webMsg";
import { createGame } from "../game/initGame";
import { Ai } from "../game/pongAi/qLearning";
import { Ball } from "../game/Ball";
import { Paddle } from "../game/Paddle";
import { Game } from "../game/Game";

export function handleSolo(playerInfos: playerStat, msg: webMsg) {
	if (!playerInfos) return;
	playerInfos.mode = msg.type;
	playerInfos.inGame = true;
	playerInfos.game = createGame(playerInfos);
	console.log(`start game solo with ia for ${playerInfos.name}`);
	playerInfos.game.start();
}

export function handleCollisionWithPlayer1(ball: Ball, player1: Paddle, player2: Paddle, game: Game) {

	//recompense de l action precedente choisis
	player2.getAi().updateReward(3);

	//calcule de prediction arrive ball sens oppose
	player2.getAi().getReboundBall(ball, player2, player1);

	//mise a jour du nouveau current
	player2.getAi().getStateFromGame(ball, player1, player2);
	 
	// update de  la Qtable du previous avec son reward  avec le nouveau current
	player2.getAi().updateQtable();

	//mise a zero des mouvements
	game.setFramerate(0);

	//choix de l action en fonction  du currentState et mise dans le previousstate le currentState
	player2.getAi().chooseAction();
}

export function handleScorePlayer1(ball: Ball, player1: Paddle, player2: Paddle, game: Game) {

	//rewards player 2 prend un but reward negatif 
	player2.getAi().updateReward(2);

	//mise du current State a "kickoff" pour faire 0 dans updateqtable
	player2.getAi().setCurrentState("KICKOFF");

	//mise a jour de la qtable avec le reward le previous state et le current a zero car but
	player2.getAi().updateQtable();

	//mise a zero des mouvements
	game.setFramerate(0);

	//remise en jeu suite a un but reset des positions
	game.serviceBall(0, ball, player1, player2);

	//re initialisation de currenState
	player2.getAi().setCurrentState("");

	// re initialisation previous state
	player2.getAi().setPreviousState("");
}

export function handleCollisionWithPlayer2(ball: Ball, player1: Paddle, player2: Paddle, game: Game) {

	//recompense de l action precedente choisis
	player2.getAi().updateReward(4);

	//calcule de prediction arrive ball sens oppose
	player2.getAi().getReboundBall(ball, player2, player1);

	//mise a jour du nouveau current
	player2.getAi().getStateFromGame(ball, player1, player2);

	// update de  la Qtable du previous avec son reward  avec le nouveau current
	player2.getAi().updateQtable();

	//mise a zero des mouvements
	game.setFramerate(0);

	//choix de l action en fonction du  currentState et mise dans le previousstate le currentState
	player2.getAi().chooseAction();
}

export function handleScorePlayer2(ball: Ball, player1: Paddle, player2: Paddle, game: Game) {

	//rewards player 2 marque un but reward positif
	player2.getAi().updateReward(1);

	//mise du current State a "kickoff" pour faire 0 dans updateqtable
	player2.getAi().setCurrentState("KICKOFF");

	//mise a jour de la qtable avec le reward le previous state et le current a zero car but
	player2.getAi().updateQtable();

	//mise a zero des mouvements
	game.setFramerate(0);
	
	//remise en jeu suite a un but reset des positions
	game.serviceBall(1, ball, player1, player2);

	//re initialisation de currenState
	player2.getAi().setCurrentState("");

	// re initialisation previous state
	player2.getAi().setPreviousState("");

}