import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { room, player } from "@Pacman/TypesPacman";
import StateManager from './game/StateManager';
import { request } from '@typesChat';
import Engine from './game/Engine';

function createTestRoom(player: player, room: room): void {
	const player2: player = {
		id: 2,
		username: 'player2',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player3: player = {
		id: 3,
		username: 'player3',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player4: player = {
		id: 4,
		username: 'player4',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player5: player = {
		id: 5,
		username: 'player5',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	if (room.players.length < 5) room.players.push(player2);
	// if (room.players.length < 5) room.players.push(player3);
	// if (room.players.length < 5) room.players.push(player4);
	// if (room.players.length < 5) room.players.push(player5);
}

(async () => {
	StateManager.loopRooms();
})();

function sendResponse(ws: WebSocket, action: string, result: string, notification: string[], data: any = null): void {
	ws?.send(JSON.stringify({ action, result, notification, data }));
}

function handleAddUser(ws: WebSocket, player: player): void {
	StateManager.addPlayer(ws, player);
	const tmp = new Map<number, WebSocket>();
	tmp.set(player.id, ws);
	StateManager.sendRooms(tmp);
}

function handleCreateRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.name) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier un nom de salle']);
	if (player.room) return sendResponse(ws, 'error', 'error', ['Vous êtes déjà dans une salle']);
	if (json.name.length < 3 || json.name.length > 15) return sendResponse(ws, 'error', 'error', ['Le nom de la salle doit faire entre 3 et 15 caractères']);
	if (StateManager.RoomManager.getRoomByName(json.name)) return sendResponse(ws, 'error', 'error', ['Le nom de la salle est déjà utilisé']);
	const room = StateManager.RoomManager.createRoom(player, json.name);
	player.room = room;
	StateManager.sendRooms();
}

function handleJoinRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.room_id) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier un id de salle']);
	if (player.room) return sendResponse(ws, 'error', 'error', ['Vous êtes déjà dans une salle']);
	const room = StateManager.RoomManager.getRoomById(json.room_id);
	if (!room) return sendResponse(ws, 'error', 'error', ['La salle n\'existe pas']);
	if (room.state == 'active') return sendResponse(ws, 'error', 'error', ['La salle est déjà lancée']);
	if (room.players.length >= 5) return sendResponse(ws, 'error', 'error', ['La salle est pleine']);
	if (StateManager.RoomManager.joinRoom(player, json.room_id)) player.room = room;
	StateManager.sendRooms();
}

function handleKickRoom(ws: WebSocket, player: player, json: any): void {
	if (!player.room) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas dans une salle']);
	if (!json.user_id) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier l\'id de la personne à expulser']);
	if (player.room.state == 'active') return sendResponse(ws, 'error', 'error', ['La salle est déjà lancée']);
	if (player.room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas le propriétaire de la salle']);
	const wsUserKick = StateManager.getPlayerWs(json.user_id);
	StateManager.RoomManager.removePlayerFromRoom(player.room, json.user_id);
	sendResponse(wsUserKick, 'setOwner', 'error', ['Vous avez été expulsé de la salle']);
	sendResponse(ws, 'setOwner', 'success', ['Le joueur a été expulsé']);
	StateManager.sendRooms();
}

function handleLeaveRoom(ws: WebSocket, player: player): void {
	if (!player.room) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas dans une salle']);
	StateManager.RoomManager.removePlayerFromRoom(player.room, player.id);
	StateManager.sendRooms();
}

function handleSetOwnerRoom(ws: WebSocket, player: player, json: any): void {
	if (!player.room) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas dans une salle']);
	if (!json.user_id) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier l\'id de la personne à promouvoir']);
	const room = player.room;
	if (room.state == 'active') return sendResponse(ws, 'error', 'error', ['La salle est déjà lancée']);
	if (room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas le propriétaire de la salle']);
	const newOwner = room.players.find(p => p.id === json.user_id);
	if (!newOwner) return sendResponse(ws, 'error', 'error', ['Le joueur n\'est pas dans la salle']);
	if (newOwner.id === room.owner_id) return sendResponse(ws, 'error', 'error', ['Le joueur est déjà propriétaire']);
	room.owner_id = newOwner.id;
	room.owner_username = newOwner.username;
	room.players = room.players.filter(p => p.id !== newOwner.id);
	room.players.unshift(newOwner);
	const wsNewOwner = StateManager.getPlayerWs(newOwner.id);
	sendResponse(wsNewOwner, 'setOwner', 'success', ['Vous avez été promu propriétaire']);
	sendResponse(ws, 'setOwner', 'success', ['Le joueur a été promu propriétaire']);
	StateManager.sendRooms();
}

function handleLaunchRoom(ws: WebSocket, player: player): void {
	if (!player.room) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas dans une salle']);
	if (player.room.state == 'active') return sendResponse(ws, 'error', 'error', ['La salle est déjà lancée']);
	if (player.room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas le propriétaire de la salle']);
	// if (room.players.length < 2) return sendResponse(ws, 'error', 'error', ['Il faut au moins 2 joueurs pour lancer la partie']);
	if (player.room.players.length > 5) return sendResponse(ws, 'error', 'error', ['Il ne peut pas y avoir plus de 5 joueurs']);
	createTestRoom(player, player.room);
	StateManager.startGame(player.room);
	StateManager.sendRooms();
}

function handlePlayerMove(ws: WebSocket, player: player, json: any): void {
	if (!json.direction) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier une direction']);
	if (json.direction !== 'UP' && json.direction !== 'DOWN' && json.direction !== 'LEFT' && json.direction !== 'RIGHT') return sendResponse(ws, 'error', 'error', ['La direction doit être UP, DOWN, LEFT ou RIGHT']);
	if (!player.room) return sendResponse(ws, 'error', 'error', ['Vous n\'êtes pas en game']);
	if (player.room.state != 'active') return sendResponse(ws, 'error', 'error', ['La game n\'est pas lancée']);
	player.room.engine?.getPlayerById(player.id)?.changeDirection(json.direction);
}

async function PacManWebSocket(ws: WebSocket, user: User): Promise<void> {
	console.log('PacmanWS Connexion de l\'utilisateur:', user?.id);

	const room = StateManager.RoomManager.getRoomByPlayerId(user.id);

	const player: player = {
		id: user.id,
		username: user.username,
		avatar: user.avatar,
		lang: user.lang,
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
		room: room,
	};
	if (room) {
		StateManager.RoomManager.updatePlayerInRoom(room, player);
		room.engine?.updatePlayer(player, ws);
	}

	handleAddUser(ws, player);
	ws.on('message', (message: Buffer) => {
		let text: request | null = null;
		try {
			text = JSON.parse(message.toString().trim());
		} catch (e) {
			sendResponse(ws, 'error', 'error', ['Veuillez envoyer une réponse au format JSON']);
			return;
		}

		const action = text.action;
		if (!action) {
			sendResponse(ws, 'error', 'error', ['Veuillez spécifier une action']);
			return;
		}

		if (action !== 'ping') player.room = StateManager.RoomManager.getRoomByPlayerId(player.id);
		switch (action) {
			case 'ping':
				player.updateAt = Date.now();
				break;
			case 'createRoom':
				handleCreateRoom(ws, player, text);
				break;
			case 'joinRoom':
				handleJoinRoom(ws, player, text);
				break;
			case 'kickRoom':
				handleKickRoom(ws, player, text);
				break;
			case 'leaveRoom':
				handleLeaveRoom(ws, player);
				break;
			case 'setOwner':
				handleSetOwnerRoom(ws, player, text);
				break;
			case 'launchRoom':
				handleLaunchRoom(ws, player);
				break;
			case 'joinSpectator':
				sendResponse(ws, 'error', 'error', ['Cette fonctionnalité n\'est pas encore disponible']);
				break;
			case 'playerMove':
				handlePlayerMove(ws, player, text);
				break;
			default:
				ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ['Action non reconnue'] })); // to close
				break;
		}
	});

	ws.on('close', () => {
		console.log('PacmanWS Déconnexion de l\'utilisateur:', user?.id);
	});

	ws.on('error', (error: Error) => {
		console.error('PacmanWS Erreur WebSocket:', error);
		if (ws.readyState === WebSocket.OPEN) {
			ws.close(1008, JSON.stringify({ action: 'error', result: 'error', notification: ['Erreur WebSocket'] }));
		}
	});
}

export { PacManWebSocket };