import { listTournament } from "../state/serverState";
import { playerStat, Tournament} from "../types/playerStat";
import { webMsg } from "../types/webMsg";


let idTournament: number = 0;

export function handleTournament(playerInfos: playerStat, msg: webMsg) {
	if (playerInfos.inGame !== true && msg.action === "Create")
		createTournament(playerInfos, msg);
	else if (msg.value  === "Join" && playerInfos.inGame !== true) {
		//join tournois par id et par name mettre a jour le tournois ainsi que le statue et faire la mise a jour a tout les autres 
		// joueur 
		// empecher de rejoindre un tournois complet 
		// une fois join si le tournois est complet lancer le match making pour le tournois complet 
	}
}

function createTournament(playerInfos: playerStat, msg: webMsg)  {
	const tournament: Tournament = {
		listPlayer: new Set(),
		name: msg.value,
		size : msg.sizeTournament,
		isFull : false,
	}
	playerInfos.mode = msg.type;
	playerInfos.inGame = true;
	tournament.listPlayer.add(playerInfos);
	listTournament.set(idTournament,tournament);
	idTournament++;
	updateTournament();
	//faire une fonction envoyer la list des tournois present dans list tournament et le faire a tout les socket des joueur player info
	// des qu une action est faite join create mettre a jour la totalite des socket des joueurs present dans list tournament  
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
					"isFull": boolean
				} [];
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
			})
	}
	const jsonString: string = JSON.stringify(jsonTournament);
	//envoi de la mise a jour a tout les players
	for (const [id, tournament] of listTournament) {
		for(const player of tournament.listPlayer) {
			player.socket.send(jsonString);
		}
	}
}