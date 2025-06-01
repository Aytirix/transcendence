import { FastifyRequest, FastifyReply } from 'fastify';
import pacmanModel from '@models/modelPacman';
import tools from '@tools';
import { TileType } from "@Pacman/TypesPacman";
import PacmanMap from '@wsPacman/game/map/Map';
import { WebSocket } from 'ws'
import { room, player } from "@Pacman/TypesPacman";
import StateManager from '@wsPacman/game/StateManager';


export function sendResponse(ws: WebSocket, action: string, result: string, notification: string | string[], data: any = null): void {
	console.log(`Sending response to action: ${action}, result: ${result}, notification: ${notification}`);
	ws?.send(JSON.stringify({ action, result, notification, data }));
}

export const getAllMapForUser = async (ws: WebSocket, user_id: number) => {
	const maps = await pacmanModel.getAllMapsForUser(user_id);
	const validMaps = maps.map(map => {
		const is_valid = PacmanMap.validateMap(map.map).is_valid;
		return {
			...map,
			is_valid: is_valid,
			errors: is_valid ? [] : PacmanMap.validateMap(map.map).errors,
		};
	});
	sendResponse(ws, 'getAllMapsForUser', 'success', [], { maps: tools.arrayToObject(validMaps) });
};

export const insertOrUpdateMap = async (ws: WebSocket, user_id: number, request: any) => {
	if (!request || !request.mapData) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.map.required')]);
	const { name, map, is_public } = request.mapData as {
		name: string;
		map: TileType[][];
		is_public: boolean;
	};
	const id = request.mapData.id;
	console.log(`id map: ${id}`);

	if (!name) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.name.required')]);
	if (!map || !Array.isArray(map) || map.length === 0 || !map[0] || !Array.isArray(map[0])) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.map.required')]);
	if (is_public === undefined) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.is_public.required')]);
	if (name.length < 3 || name.length > 20 || !/^[a-zA-Z0-9 _-]+$/.test(name)) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.name.invalid')]);
	console.log(`Map length: ${map.length}, Map row length: ${map[0].length} - Map some row length: ${map.some(row => row.length)}`);
	if (map.length < 29 || map.length > 29 || map.some(row => row.length !== 31 || !/^[#ToPBICY\-. ]+$/.test(row.join('')))) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.map.invalid')]);

	if (id) {
		console.log(`id map: ${id} - user_id: ${user_id}`);
		const existingMap = await pacmanModel.getMapForUserById(id, user_id);
		console.log('existingMap', existingMap);
		if (!existingMap || existingMap.length === 0) return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.map.required')]);
	} else {
		const existingMaps = await pacmanModel.getMapForUserByName(user_id, name);
		if (existingMaps && existingMaps.length > 0) {
			return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('pacman.error.map.nameAlreadyExists')]);
		}
	}
	
	const { is_valid, errors } = PacmanMap.validateMap(map);
	const infoMap = {
		id: id || null,
		user_id: user_id,
		name: name,
		map: map,
		is_public: is_public,
		is_valid: is_valid,
		errors: errors,
		isCreated: false,
	}
	
	if (id && !(await pacmanModel.updateMap(infoMap))) {
		console.log('Map updated:', infoMap);
		return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('errors.pacman.updateMapError')]);
	}
	else if (!id && !(await pacmanModel.insertMap(infoMap))) {
		infoMap.isCreated = true;
		console.log('Map inserted:', infoMap);
		return sendResponse(ws, 'insertOrUpdateMap', 'error', [ws.i18n.t('errors.pacman.insertMapError')]);
	}

	sendResponse(ws, 'insertOrUpdateMap', 'success', [], { map: infoMap, isCreated: !id });
};

export const deleteMap = async (ws: WebSocket, user_id: number, request: any) => {
	const { id } = request as { id: number };
	if (!id) {
		sendResponse(ws, 'deleteMap', 'error', [ws.i18n.t('pacman.error.map.required')]);
	}
	const existingMap = await pacmanModel.getMapForUserById(id, user_id);
	if (!existingMap || existingMap.length === 0) return sendResponse(ws, 'deleteMap', 'error', [ws.i18n.t('pacman.error.map.required')]);
	if (!(await pacmanModel.deleteMap(id))) return sendResponse(ws, 'deleteMap', 'error', [ws.i18n.t('pacman.error.deleteMapError')]);
	return sendResponse(ws, 'deleteMap', 'success', [ws.i18n.t('pacman.success.mapDeleted')], { id: id });
};

export function createTestRoom(player: player, room: room): void {
	const player2: player = {
		id: -1,
		username: 'bot1',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player3: player = {
		id: -2,
		username: 'bot2',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player4: player = {
		id: -3,
		username: 'bot3',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	const player5: player = {
		id: -4,
		username: 'bot4',
		avatar: '',
		lang: 'fr',
		updateAt: Date.now(),
		gameId: null,
		elo: 1000,
	};
	if (room.players.length < 5) room.players.push(player2);
	if (room.players.length < 5) room.players.push(player3);
	if (room.players.length < 5) room.players.push(player4);
	if (room.players.length < 5) room.players.push(player5);
}

export function handleAddUser(ws: WebSocket, player: player): void {
	StateManager.addPlayer(ws, player);
	const tmp = new Map<number, WebSocket>();
	tmp.set(player.id, ws);
	StateManager.sendRooms(tmp);
}

export function handleCreateRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.name) return sendResponse(ws, 'error', 'error', ['Veuillez spécifier un nom de salle']);
	if (player.room) return sendResponse(ws, 'error', 'error', ['Vous êtes déjà dans une salle']);
	if (json.name.length < 3 || json.name.length > 15) return sendResponse(ws, 'error', 'error', ['Le nom de la salle doit faire entre 3 et 15 caractères']);
	if (StateManager.RoomManager.getRoomByName(json.name)) return sendResponse(ws, 'error', 'error', ['Le nom de la salle est déjà utilisé']);
	const room = StateManager.RoomManager.createRoom(player, json.name);
	player.room = room;
	StateManager.sendRooms();
}

export function handleJoinRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.room_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.id_required')]);
	if (player.room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_in_room')]);
	const room = StateManager.RoomManager.getRoomById(json.room_id);
	if (!room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_found')]);
	if (room.state == 'active') return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_active')]);
	if (room.players.length >= 5) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.room_full')]);
	if (StateManager.RoomManager.joinRoom(player, json.room_id)) player.room = room;
	StateManager.sendRooms();
}

export function handleKickRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.user_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.user_id_required_kick')]);
	if (player.room.state == 'active') return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_active')]);
	if (player.room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_owner')]);
	const wsUserKick = StateManager.getPlayerWs(json.user_id);
	StateManager.RoomManager.removePlayerFromRoom(player.room, json.user_id);
	sendResponse(wsUserKick, 'setOwner', 'error', [ws.i18n.t('pacman.user_kicked')]);
	sendResponse(ws, 'setOwner', 'success', [ws.i18n.t('pacman.kick_success')]);
	StateManager.sendRooms();
}

export function handleLeaveRoom(ws: WebSocket, player: player): void {
	StateManager.RoomManager.removePlayerFromRoom(player.room, player.id);
	StateManager.sendRooms();
}

export function handleSetOwnerRoom(ws: WebSocket, player: player, json: any): void {
	if (!json.user_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.user_id_required_set_owner')]);
	const room = player.room;
	if (room.state == 'active') return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_active')]);
	if (room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_owner')]);
	const newOwner = room.players.find(p => p.id === json.user_id);
	if (!newOwner) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.user_not_in_room')]);
	if (newOwner.id === room.owner_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_owner')]);
	room.owner_id = newOwner.id;
	room.owner_username = newOwner.username;
	room.players = room.players.filter(p => p.id !== newOwner.id);
	room.players.unshift(newOwner);
	const wsNewOwner = StateManager.getPlayerWs(newOwner.id);
	sendResponse(wsNewOwner, 'setOwner', 'success', [ws.i18n.t('pacman.promoted')]);
	sendResponse(ws, 'setOwner', 'success', [ws.i18n.t('pacman.promoted_success')]);
	StateManager.sendRooms();
}

export function handleLaunchRoom(ws: WebSocket, player: player): void {
	if (player.room.state == 'active') return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_active')]);
	if (player.room.owner_id !== player.id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_owner')]);
	// if (player.room.players.length < 2) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.too_few_players')]);
	if (player.room.players.length > 5) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.too_many_players')]);
	createTestRoom(player, player.room);
	StateManager.startGame(player.room);
	StateManager.sendRooms();
}

export function handlePlayerMove(ws: WebSocket, player: player, json: any): void {
	if (!json.direction) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.direction_required')]);
	if (json.direction !== 'UP' && json.direction !== 'DOWN' && json.direction !== 'LEFT' && json.direction !== 'RIGHT')
		return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.invalid_direction')]);
	if (!player.room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_in_game')]);
	if (player.room.state != 'active') return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_started')]);
	player.room.engine?.getPlayerById(player.id)?.changeDirection(json.direction);
}

export function handleJoinRoomSpectator(ws: WebSocket, player: player, json: any): void {
	if (!json.room_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.id_required')]);
	if (player.room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_in_room')]);
	const room = StateManager.RoomManager.getRoomById(json.room_id);
	if (!room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_found')]);
	StateManager.joinRoomSpectator(room, player, ws);
}

export function handleLeaveRoomSpectator(ws: WebSocket, player: player, json: any): void {
	if (!json.room_id) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.id_required')]);
	if (player.room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.already_in_room')]);
	const room = StateManager.RoomManager.getRoomById(json.room_id);
	if (!room) return sendResponse(ws, 'error', 'error', [ws.i18n.t('pacman.not_found')]);
	StateManager.leaveRoomSpectator(room, player);
}

export default {
	sendResponse,
	getAllMapForUser,
	insertOrUpdateMap,
	deleteMap,
	createTestRoom,
	handleAddUser,
	handleCreateRoom,
	handleJoinRoom,
	handleKickRoom,
	handleLeaveRoom,
	handleSetOwnerRoom,
	handleLaunchRoom,
	handlePlayerMove,
	handleJoinRoomSpectator,
	handleLeaveRoomSpectator,
};