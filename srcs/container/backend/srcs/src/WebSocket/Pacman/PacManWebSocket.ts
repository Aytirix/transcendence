import { WebSocket } from 'ws'
import { User } from '@types'
import { room, player } from "@Pacman/TypesPacman";
import StateManager from './game/StateManager';
import { request } from '@typesChat';
import controllerPacman from '@controllers/controllerPacman';

(async () => {
	StateManager.loopRooms();
})();

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
		isSpectator: false,
	};
	if (room) {
		StateManager.RoomManager.updatePlayerInRoom(room, player);
		room.engine?.updatePlayer(player, ws);
	}

	controllerPacman.handleAddUser(ws, player);
	ws.on('message', (message: Buffer) => {
		let text: request | null = null;
		try {
			text = JSON.parse(message.toString().trim());
		} catch (e) {
			controllerPacman.sendResponse(ws, 'error', 'error', ws.i18n.t('errors.JSONParseError'));
			return;
		}

		const action = text.action;
		if (!action) {
			controllerPacman.sendResponse(ws, 'error', 'error', ws.i18n.t('pacman.error.actionNotFound'));
			return;
		}

		if (action === 'ping') {
			player.updateAt = Date.now();
			return;
		}

		if (player.isSpectator && action !== 'leaveRoom') {
			controllerPacman.sendResponse(ws, 'error', 'error', ws.i18n.t('pacman.rooms.YourModeSpectator'));
			return;
		}

		if (!player.room && action !== 'createRoom' && action !== 'joinRoom' && action !== 'joinSpectator' && action !== 'leaveSpectator' && action !== 'getAllMapForUser' && action !== 'insertOrUpdateMap' && action !== 'deleteMap') {
			controllerPacman.sendResponse(ws, 'error', 'error', ws.i18n.t('pacman.rooms.mustBeInRoom'));
			return;
		}

		player.room = StateManager.RoomManager.getRoomByPlayerId(player.id);
		switch (action) {
			case 'createRoom':
				controllerPacman.handleCreateRoom(ws, player, text);
				break;
			case 'joinRoom':
				controllerPacman.handleJoinRoom(ws, player, text);
				break;
			case 'kickRoom':
				controllerPacman.handleKickRoom(ws, player, text);
				break;
			case 'leaveRoom':
				controllerPacman.handleLeaveRoom(ws, player);
				break;
			case 'setOwner':
				controllerPacman.handleSetOwnerRoom(ws, player, text);
				break;
			case 'launchRoom':
				controllerPacman.handleLaunchRoom(ws, player);
				break;
			case 'joinSpectator':
				controllerPacman.handleJoinRoomSpectator(ws, player, text);
				break;
			case 'playerMove':
				controllerPacman.handlePlayerMove(ws, player, text);
				break;
			case 'getAllMapForUser':
				controllerPacman.getAllMapForUser(ws, player.id);
				break;
			case 'insertOrUpdateMap':
				controllerPacman.insertOrUpdateMap(ws, player.id, text);
				break;
			case 'deleteMap':
				controllerPacman.deleteMap(ws, player.id, text);
				break;
			default:
				ws.send(JSON.stringify({ action: 'error', result: 'error', notification: 'Action non reconnue' })); // to close
				break;
		}
	});

	ws.on('close', () => {
		console.log('PacmanWS Déconnexion de l\'utilisateur:', user?.id);
	});

	ws.on('error', (error: Error) => {
		console.error('PacmanWS Erreur WebSocket:', error);
		if (ws.readyState === WebSocket.OPEN) {
			ws.close(1008, JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('errors.wsError') }));
		}
	});
}

export { PacManWebSocket };