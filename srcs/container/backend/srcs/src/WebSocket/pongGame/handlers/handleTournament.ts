import controllerPong from "@controllers/controllerPong";
import { Game } from "../game/Game";
import { createGame } from "../game/initGame";
import { listTournament, sockets } from "../state/serverState";
import { playerStat, Tournament, userStatsPong } from "../types/playerStat";
import { webMsg } from "../types/webMsg";
import modelPong from '@models/modelPong';

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
	else if (msg.action === "assign") {
		const game = playerInfos.game;
		if (!game) return;
		if (game.getPlayer1().getPlayerInfos().id === playerInfos.id) {
			game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p1" }))
			game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "Pause" }))
		} else if (game.getPlayer2().getPlayerInfos().id === playerInfos.id) {
			game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p2" }))
			game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "Pause" }))
		}
	}
	else if (msg.action === "Start") {
		const game = playerInfos.game;
		if (!game) return;
		if (game.getPlayer1().getPlayerInfos().id === playerInfos.id) {
			game.setPlayer1Ready(true);
		} else if (game.getPlayer2().getPlayerInfos().id === playerInfos.id) {
			game.setPlayer2Ready(true);
		}
		if (game.getPlayer1Ready() && game.getPlayer2Ready()) {
			game.setStatus("PLAYING");
				game.start();
		}
	}
	else if (msg.action === "readyToNext") {
		playerInfos.readyToNext = true;
		const tournament = listTournament.get(playerInfos.idTournament)
		if (!tournament) return;
		if (!tournament.nextManche) return;
		if (checkReady(tournament))
			dispatchMatch(tournament);
	}
}

function quitTournament(playerInfos: playerStat) {
	for (const [id, tournament] of listTournament) {
		if (id === playerInfos.idTournament) {
			const idx = tournament.waitingWinner.indexOf(playerInfos);
			if (idx !== -1) {
				tournament.waitingWinner.splice(idx, 1);
				for (let i : number = 0; i < tournament.currentMatch.length; i++) {
					const match = tournament.currentMatch[i];
					if (match.player1.id === playerInfos.id || match.player2.id === playerInfos.id) {
						tournament.currentMatch.splice(i, 1);
						break;
					}
				}
			}
			else {
				tournament.listPlayer.delete(playerInfos);
				if (tournament.listPlayer.size === 0) {
					listTournament.delete(id);
				} else {
					tournament.isFull = false;
				}
				break; 
			}
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
		nextManche: false,
		isFinal: false,
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

async function updateTournament() {

		let jsonTournament: {
			type: string,
			action: string,
			value: {
				"id": number,
				"name": string,
				"max": number,
				"current": number,
				"isFull": boolean,
				"listPlayers": {
					"name": string,
					"avatar": string,
					"statistique": userStatsPong,
				}[]
			}[];
		} = {
			type: "Tournament",
			action: "LIST_RESPONSE",
			value: []
		};

		for (const [id, tournament] of listTournament) {
			let listPlayerTemp: Array<any> = [];
			for (const player of tournament.listPlayer) {
				const result = await modelPong.getStatisticsForUser(player.id)
				let statUserData: userStatsPong = {
				total: {
					victoire: 0,
					defaite: 0,
					abandon: 0,
					nbParti: 0,
					victoirePour100: 0,
					defaitePour100: 0,
					abandonPour100: 0 
				},
				tournamentVictory: 0,
			}
			controllerPong.generalUserStats(result ,statUserData)
			controllerPong.getStatsTournamentWinner(statUserData, result)

			listPlayerTemp.push({
				name: player.name,
				avatar: player.avatar,
				statistique: statUserData
			})
		}
			jsonTournament.value.push({
				id: id,
				name: tournament.name,
				max: tournament.size,
				current: tournament.listPlayer.size,
				isFull: tournament.isFull,
				listPlayers: listPlayerTemp
			});
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
		if (!player1.switchManche) {
			const game: Game = createGame(player1, player2);
			player1.game = game;
			player1.resultMatchTournament = "Current";
			player2.game = game;
			player2.resultMatchTournament = "Current";
			game.setTournament(tournament);
		}
		else if (player1.switchManche)
			player1.switchManche = false;

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
			p1ResultMatchTournament: player1.resultMatchTournament = "Current", //ajout
			player2: player2.name,
			player2Avatar: player2.avatar,
			p2ResultMatchTournament: player2.resultMatchTournament = "Current" //ajout
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
		player.inRoom = false;
	}
}
function dispatchMatch(tournament: Tournament) {
	tournament.nextManche = false;
	shuffle(tournament.waitingWinner);
	const length : number = tournament.waitingWinner.length;
	let stockWinner : playerStat;
	tournament.isFinal = (length === 2);
	if (length % 2 !== 0) {
		if (length === 1) {
			tournament.winner = true;

			tournament.waitingWinner[0].winnerTournament = true;

				modelPong.insertStatistic(tournament.waitingWinner[0].id, 1, 1, tournament.waitingWinner[0].mode, 0)
				tournament.waitingWinner[0].socket.send(JSON.stringify({type: "WinnerTournament"}))
				setTimeout(() => {
					tournament.waitingWinner[0].socket.send(JSON.stringify({type: "data", value: {
						name: tournament.waitingWinner[0].name,
						avatar: tournament.waitingWinner[0].avatar,
					}}))
					tournament.waitingWinner[0].winnerTournament = false;
					tournament.waitingWinner[0].inGame = false;
					tournament.waitingWinner[0].inRoom = false;
				}, 300)
				listTournament.delete(tournament.idTournament);
			return ;
		}
		stockWinner = tournament.waitingWinner[0];
		tournament.waitingWinner.splice(0, 1);
		stockWinner.socket.send(JSON.stringify({action: "WinNextManche"}))
	}
	for (let i: number = 0; i < tournament.waitingWinner.length; i += 2) {
		tournament.currentMatch.push({
			player1: tournament.waitingWinner[i],
			player2: tournament.waitingWinner[i + 1]
		});
		tournament.waitingWinner[i].resultMatchTournament = "Current";
		tournament.waitingWinner[i].readyToNext = false;
		tournament.waitingWinner[i + 1].resultMatchTournament = "Current";
		tournament.waitingWinner[i + 1].readyToNext = false;
	}
	tournament.currentManche++;
	tournament.waitingWinner.length = 0;	
	if (stockWinner) {
		tournament.waitingWinner.push(stockWinner);
		stockWinner.switchManche = true;
		tournament.currentMatch.push({
			player1: tournament.waitingWinner[0],
			player2: tournament.waitingWinner[0]
		});
	}
	messageTournament(tournament, "Start", "nouvelle Manche");
	displayTournament(tournament);
	createMatchPairs(tournament);
}

export function isOnFinishMatch(tournament: Tournament, player1: playerStat, player2: playerStat) {
	let looseId: number = 0;
	if (player1 && player1.resultMatchTournament === "Win") {
		tournament.waitingWinner.push(player1);
		looseId = player2.id
		player2.inGame = false
		player2.inRoom = false
		tournament.listPlayer.delete(player2);

		if (!tournament.isFinal) {
			player1.inRoom = true;
			player1.socket.send(JSON.stringify({type: "Win"}))
		}
	}
	else if (player2 && player2.resultMatchTournament === "Win") {

		tournament.waitingWinner.push(player2);
		looseId = player1.id
		player1.inGame = false
		player1.inRoom = false
		tournament.listPlayer.delete(player1);
		if (!tournament.isFinal) {
			player2.inRoom = true;
			player2.socket.send(JSON.stringify({type: "Win"}))
		}
	}
	if (tournament.waitingWinner.length === tournament.currentMatch.length) {
		tournament.currentMatch.length = 0;
		if (tournament.waitingWinner.length === 1) {
			tournament.winner = true;

			tournament.waitingWinner[0].winnerTournament = true;
			modelPong.insertStatistic(tournament.waitingWinner[0].id, 1, 1, tournament.waitingWinner[0].mode, looseId);
				tournament.waitingWinner[0].socket.send(JSON.stringify({type: "WinnerTournament"}))
				setTimeout(() => {
					tournament.waitingWinner[0].socket.send(JSON.stringify({type: "data", value: {
						name: tournament.waitingWinner[0].name,
						avatar: tournament.waitingWinner[0].avatar,
					}}))
					tournament.waitingWinner[0].winnerTournament = false;
					tournament.waitingWinner[0].inGame = false;
					tournament.waitingWinner[0].inRoom = false;
				}, 300)
				listTournament.delete(tournament.idTournament);
			return ;
		}
		tournament.nextManche = true;
	}
}

function checkReady(tournament: Tournament) : boolean {
	for (const player of tournament.waitingWinner) {
		if (!player.readyToNext){
			return (false)
		}
	}
	return (true);
}

async function actualiseDisplay(playerinfos: playerStat) {
		let jsonTournament: {
			type: string,
			action: string,
			value: {
				"id": number,
				"name": string,
				"max": number,
				"current": number,
				"isFull": boolean,
				"listPlayers": {
					"name": string,
					"avatar": string,
					"statistique": userStatsPong,
				}[]
			}[];
		} = {
			type: "Tournament",
			action: "LIST_RESPONSE",
			value: []
		};
	for (const [id, tournament] of listTournament) {
		let listPlayerTemp: Array<any> = [];
			for (const player of tournament.listPlayer) {
				const result = await modelPong.getStatisticsForUser(player.id)
				let statUserData: userStatsPong = {
				total: {
					victoire: 0,
					defaite: 0,
					abandon: 0,
					nbParti: 0,
					victoirePour100: 0,
					defaitePour100: 0,
					abandonPour100: 0
				},
				tournamentVictory: 0,
			}
			controllerPong.generalUserStats(result ,statUserData)
			listPlayerTemp.push({
				name: player.name,
				avatar: player.avatar,
				statistique: statUserData
			})
		}
		
		if (tournament.waitingWinner.length === 0) {
			jsonTournament.value.push({
				id: id,
				name: tournament.name,
				max: tournament.size,
				current: tournament.listPlayer.size,
				isFull: tournament.isFull,
				listPlayers: listPlayerTemp
			});
		} else {
			jsonTournament.value.push({
				id: id,
				name: tournament.name,
				max: tournament.size,
				current: tournament.waitingWinner.length,
				isFull: tournament.isFull,
				listPlayers: listPlayerTemp
			});
		}
	}
	playerinfos.socket.send(JSON.stringify(jsonTournament));
}
