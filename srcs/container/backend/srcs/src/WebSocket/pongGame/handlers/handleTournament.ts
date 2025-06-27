import { Game } from "../game/Game";
import { createGame } from "../game/initGame";
import { listTournament, sockets } from "../state/serverState";
import { playerStat, Tournament } from "../types/playerStat";
import { webMsg } from "../types/webMsg";


let idTournament: number = 0;

export function handleTournament(playerInfos: playerStat, msg: webMsg) {
	if (playerInfos.inGame !== true && msg.action === "Create")
		createTournament(playerInfos, msg);
	else if (msg.action === "Join" && playerInfos.inGame !== true)
		joinTournament(playerInfos, msg);
	else if (msg.action === "Display") {
		actualiseDisplay(playerInfos);
	}
	else if (msg.action === "Quit")
		quitTournament(playerInfos)
	else if (msg.action === "infoTournament")
		playerInfos.socket.send(JSON.stringify({ action: "infoTournament", id: playerInfos.idTournament, name: playerInfos.name }))
	else if (msg.action === "Start") {
		const game = playerInfos.game;
		if (!game) return;
		if (game.getPlayer1().getPlayerInfos().id === playerInfos.id) {
			game.setPlayer1Ready(true);
			game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p1" }))
			game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "Pause" }))
		} else if (game.getPlayer2().getPlayerInfos().id === playerInfos.id) {
			game.setPlayer2Ready(true);
			game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p2" }))
			game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "Pause" }))
		}
		if (game.getPlayer1Ready() && game.getPlayer2Ready()) {
			game.setStatus("PLAYING");
			setTimeout(() => {
				game.start();
			}, 3000)
		}
	}
}

function quitTournament(playerInfos: playerStat) {
	for (const [id, tournament] of listTournament) {
		if (id === playerInfos.idTournament) {
			tournament.listPlayer.delete(playerInfos);
			if (tournament.listPlayer.size === 0) {
				listTournament.delete(id);
			} else {
				tournament.isFull = false;
			}
			break;
		}
	}
	playerInfos.inGame = false;
	playerInfos.idTournament = null;
	playerInfos.mode = null;
	updateTournament();
}


function createTournament(playerInfos: playerStat, msg: webMsg) {
	const tournament: Tournament = {
		listPlayer: new Set(),
		name: msg.value,
		size: msg.sizeTournament,
		isFull: false,
		winner: false,
		idTournament: idTournament,
		currentManche: 1,
		currentMatch: [],
		waitingWinner: [],
	}
	playerInfos.idTournament = tournament.idTournament;
	playerInfos.mode = msg.type;
	playerInfos.inGame = true;
	playerInfos.inRoom = true;
	tournament.listPlayer.add(playerInfos);
	listTournament.set(idTournament, tournament);
	idTournament++;
	updateTournament();

}

function joinTournament(playerInfos: playerStat, msg: webMsg) {
	const tournament: Tournament = listTournament.get(msg.id)
	if (tournament.isFull) {
		playerInfos.socket.send("Tournament is Full !!!!");
		return;
	}
	else {
		playerInfos.idTournament = tournament.idTournament;
		playerInfos.mode = msg.type;
		playerInfos.inGame = true;
		playerInfos.inRoom = true;
		tournament.listPlayer.add(playerInfos);
		console.log(tournament.listPlayer.size, tournament.size)
		if (tournament.listPlayer.size == tournament.size) {
			tournament.isFull = true;
			updateTournament();
			setTimeout(() => {
				startTournament(msg.id, tournament);
			}, 3000)
		}
	}
	updateTournament();
}

function updateTournament() {

	let jsonTournament: {
		type: string,
		action: string,
		value: {
			"id": number,
			"name": string,
			"max": number,
			"current": number,
			"isFull": boolean,
			"listPlayers": string[]
		}[];
	} = {
		type: "Tournament",
		action: "LIST_RESPONSE",
		value: []
	};
	//mise a jour du fichier json pour envoi a tout les players
	for (const [id, tournament] of listTournament) {
		jsonTournament.value.push({
			"id": id,
			"name": tournament.name,
			"max": tournament.size,
			"current": tournament.listPlayer.size,
			"isFull": tournament.isFull,
			"listPlayers": Array.from(tournament.listPlayer).map(player => player.name),
		})
	}
	const jsonString: string = JSON.stringify(jsonTournament);
	for (const [, player] of sockets) {
		player.socket.send(jsonString);
	}
}

function startTournament(id: number, tournament: Tournament) {
	messageTournament(tournament, "Start", "Lancement du tournois");
	randomMatch(tournament);
	displayTournament(tournament);
	createMatchPairs(tournament);
	//avant de passer a la manche suivante redisplay et afficher gagnant perdant 
}

function messageTournament(tournament: Tournament, action: string, message: string) {
	let jsonTournament: {
		type: string,
		action: string,
		value: string
	} = {
		type: "Tournament",
		action: action,
		value: message
	};
	for (const player of tournament.listPlayer) {
		player.socket.send(JSON.stringify(jsonTournament));
	}
}

function createMatchPairs(tournament: Tournament) {
	messageTournament(tournament, "Start", "Lancement du match dans");
	for (const { player1, player2 } of tournament.currentMatch) {
		const game: Game = createGame(player1, player2);
		player1.game = game;
		player2.game = game;
		game.setTournament(tournament);
	}
}

function randomMatch(tournament: Tournament) {
	let idMatch: number = 1;
	const playerTournament = Array.from(tournament.listPlayer)
	shuffle(playerTournament);
	for (let i: number = 0; i < playerTournament.length; i += 2) {
		tournament.currentMatch.push({
			player1: playerTournament[i],
			player2: playerTournament[i + 1]
		});
		playerTournament[i].matchTournamentNB = idMatch;
		playerTournament[i].resultMatchTournament = "Current";
		playerTournament[i + 1].matchTournamentNB = idMatch;
		playerTournament[i + 1].resultMatchTournament = "Current";
		idMatch++;
	}
}

function shuffle(playerTournament: Array<playerStat>) {
	for (let i: number = playerTournament.length - 1; i > 0; i--) {
		const j: number = Math.floor(Math.random() * (i + 1));
		[playerTournament[i], playerTournament[j]] = [playerTournament[j], playerTournament[i]];
	}
}

function displayTournament(tournament: Tournament) {
	let tab: {
		totalRound: number,
		totalMatch: number,
		player1: string;
		player1Avatar: string,
		p1ResultMatchTournament?: "Loose" | "Win" | "Current";
		player2: string
		player2Avatar: string,
		p2ResultMatchTournament?: "Loose" | "Win" | "Current";
	}[] = [];
	for (const { player1, player2 } of tournament.currentMatch) {
		tab.push({
			totalRound: Math.log2(tournament.size),
			totalMatch: tournament.currentMatch.length,
			player1: player1.name,
			player1Avatar: player1.avatar,
			p1ResultMatchTournament: player1.resultMatchTournament,
			player2: player2.name,
			player2Avatar: player2.avatar,
			p2ResultMatchTournament: player2.resultMatchTournament
		});
	}
	const jsonDisplayTournament = {
		type: "Tournament",
		action: "Display",
		currentManche: tournament.currentManche,
		value: tab
	};
	for (const player of tournament.listPlayer) {
		player.socket.send(JSON.stringify(jsonDisplayTournament));
		setTimeout(() => {
			player.inRoom = false;
		}, 2000);
	}
}
function dispatchMatch(tournament: Tournament) {
	shuffle(tournament.waitingWinner);
	for (let i: number = 0; i < tournament.waitingWinner.length; i += 2) {
		tournament.currentMatch.push({
			player1: tournament.waitingWinner[i],
			player2: tournament.waitingWinner[i + 1]
		});
		tournament.waitingWinner[i].resultMatchTournament = "Current";
		tournament.waitingWinner[i + 1].resultMatchTournament = "Current";
	}
	tournament.currentManche++;
	tournament.waitingWinner.length = 0;
	messageTournament(tournament, "Start", "nouvelle Manche");
	displayTournament(tournament);
	createMatchPairs(tournament);
}

export function isOnFinishMatch(tournament: Tournament, player1: playerStat, player2: playerStat) {
	if (player1.resultMatchTournament === "Win") {
		tournament.waitingWinner.push(player1);
		//penser a exit le looser peux etre
	}
	else if (player2.resultMatchTournament === "Win") {
		tournament.waitingWinner.push(player2);
	}
	if (tournament.waitingWinner.length === tournament.currentMatch.length) {
		displayTournament(tournament);
		tournament.currentMatch.length = 0;
		if (tournament.waitingWinner.length === 1) {
			tournament.winner = true;
			messageTournament(tournament, "Winner", `Le gagnant est ${tournament.waitingWinner[0].name}`);
			listTournament.delete(tournament.idTournament);
			//penser a supprimer le tournois de la list ensuite et aussi a supprimer le tournois de la list quand le dernier joueur sort de la file d attente 
			//penser au nettoyage des perdant nettoyage du gagnant avec un reset des donnees .
		}
		dispatchMatch(tournament);
	}

}

function actualiseDisplay(playerinfos: playerStat) {
	let jsonTournament: {
		type: string,
		action: string,
		value: {
			"id": number,
			"name": string,
			"max": number,
			"current": number,
			"isFull": boolean,
			"listPlayers": string[]
		}[];
	} = {
		type: "Tournament",
		action: "LIST_RESPONSE",
		value: []
	};
	//mise a jour du fichier json pour envoi a tout les players
	for (const [id, tournament] of listTournament) {
		jsonTournament.value.push({
			"id": id,
			"name": tournament.name,
			"max": tournament.size,
			"current": tournament.listPlayer.size,
			"isFull": tournament.isFull,
			"listPlayers": Array.from(tournament.listPlayer).map(player => player.name),
		})
	}
	playerinfos.socket.send(JSON.stringify(jsonTournament));
}
