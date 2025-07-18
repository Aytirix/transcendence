import { Friends, Group, User } from '@types';
import { State, request, req_loadMoreMessage, req_newMessage, res_pong, req_accept_friend, req_add_friend, req_remove_friend, req_refuse_friend, req_block_user, req_createGroup, req_addUserGroup, req_leaveGroup, req_deleteGroup, req_search_user, reponse } from '@typesChat';
import { WebSocket } from 'ws';
import modelsFriends from '@models/modelFriends';
import controllersChat from '@controllers/controllerChat';
import controllerFriends from '@controllers/controllerFriends';
import controllerPong from '@controllers/controllerPong';
import modelPong from '@models/modelPong';
import { mapToObject } from '@tools';
import modelFriends from '@models/modelFriends';
import modelUser from '@models/modelUser';
import i18n from '../../i18n';

let state: State = {
	user: new Map<number, User>(),
	onlineSockets: new Map<number, WebSocket>(),
	groups: new Map<number, Group>(),
	friends: new Map<number, Friends>(),
};

// Map pour stocker les intervalles d'envoi d'init_connexion par utilisateur
const userIntervals = new Map<number, NodeJS.Timeout>();

(async () => {
	state.friends = await modelsFriends.loadAllFriendRelationsFromDB();
})();

export const getSocketByUserId = (userId: number): WebSocket | null => {
	if (state.onlineSockets.has(userId)) {
		const ws = state.onlineSockets.get(userId);
		if (ws && ws.readyState === ws.OPEN) {
			return ws;
		}
	}
	return null;
}
/*
export const startInitConnexionInterval = (user: User, ws: WebSocket): void => {
	// Nettoyer l'intervalle existant s'il y en a un
	if (userIntervals.has(user.id)) {
		clearInterval(userIntervals.get(user.id)!);
	}
	
	// Créer un nouvel intervalle qui envoie init_connexion toutes les 500ms
	const interval = setInterval(async () => {
		// Vérifier que la WebSocket est toujours ouverte
		if (ws.readyState === ws.OPEN && state.onlineSockets.has(user.id)) {
			try {
				await controllersChat.init_connexion(ws, user, state);
			} catch (error) {
				console.error(`Erreur lors de l'envoi d'init_connexion pour l'utilisateur ${user.id}:`, error);
				// Si erreur, arrêter l'intervalle
				stopInitConnexionInterval(user.id);
			}
		} else {
			// Si la WebSocket est fermée, arrêter l'intervalle
			stopInitConnexionInterval(user.id);
		}
	}, 500);
	
	userIntervals.set(user.id, interval);
}

export const stopInitConnexionInterval = (userId: number): void => {
	if (userIntervals.has(userId)) {
		clearInterval(userIntervals.get(userId)!);
		userIntervals.delete(userId);
	}
}

export const cleanupAllIntervals = (): void => {
	userIntervals.forEach((interval, userId) => {
		clearInterval(interval);
	});
	userIntervals.clear();
} */

export const checkInvitePong = async (ws: WebSocket, user: User): Promise<void> => {
	const result = await modelPong.checkUserIsInvited(user.id);
	// const i18nCopy = i18n.cloneInstance({ lng: friend.lang, fallbackLng: 'fr' });
	// i18nCopy.changeLanguage(friend.lang);
	if (result) {
		if (user.id === result.friendId) {
			const friend = await modelUser.getUserById(result.userId);
			console.log('lang ', ws.i18n.lang, ' - ', ws.i18n.t('pong.invitePlayer.inviteReceived', { username: friend.username }));	
			ws.send(JSON.stringify({
				action: 'MultiInviteConfirm',
				token: result.token,
				createdAt: result.createdAt,
				txt: ws.i18n.t('pong.invitePlayer.inviteReceived', { username: friend.username }),
			}));
		} else if (user.id === result.userId) {
			const friend = await modelUser.getUserById(result.friendId);
			ws.send(JSON.stringify({
				action: 'MultiInvitePending',
				token: result.token,
				txt: ws.i18n.t('pong.invitePlayer.inviteSent', { username: friend.username }),
			}));
		}
	}
}

async function chatWebSocket(ws: WebSocket, user: User): Promise<void> {
	controllersChat.init_connexion(ws, user, state);
	checkInvitePong(ws, user);
	
	// Démarrer l'envoi périodique d'init_connexion toutes les 500ms
	//startInitConnexionInterval(user, ws);
	ws.on('message', (message: Buffer) => {
		let text: request | null = null;
		try {
			text = JSON.parse(message.toString().trim());
		} catch (e) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('errors.JSONParseError')] })); // to close
			return true;
		}

		const action = text.action;
		if (!action) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pacman.rooms.actionNotFound')] })); // to close
			return true;
		}

		switch (action) {
			case 'ping':
				const pong: res_pong = {
					action: 'pong'
				};
				ws.send(JSON.stringify(pong));
				break;
			case 'new_message':
				controllersChat.newMessage(ws, user, state, (text as req_newMessage));
				break;
			case 'loadMoreMessage':
				controllersChat.loadMoreMessage(ws, user, state, (text as req_loadMoreMessage));
				break;
			case 'create_group':
				controllersChat.createGroup(ws, user, state, (text as req_createGroup));
				break;
			case 'add_user_group':
				controllersChat.addUserGroup(ws, user, state, (text as req_addUserGroup));
				break;
			case 'remove_user_group':
				controllersChat.removeUserGroup(ws, user, state, (text as req_addUserGroup));
				break;
			case 'leave_group':
				controllersChat.leaveGroup(ws, user, state, (text as req_leaveGroup));
				break;
			case 'delete_group':
				controllersChat.deleteGroup(ws, user, state, (text as req_deleteGroup));
				break;
			case 'search_user':
				controllerFriends.searchUser(ws, user, state, (text as req_search_user));
				break;
			case 'add_friend':
				controllerFriends.addFriend(ws, user, state, (text as req_add_friend));
				break;
			case 'remove_friend':
				controllerFriends.removeFriend(ws, user, state, (text as req_remove_friend));
				break;
			case 'accept_friend':
				controllerFriends.acceptFriend(ws, user, state, (text as req_accept_friend));
				break;
			case 'refuse_friend':
				controllerFriends.refuseFriend(ws, user, state, (text as req_refuse_friend));
				break;
			case 'cancel_request':
				controllerFriends.cancelFriend(ws, user, state, (text as req_refuse_friend));
				break;
			case 'block_user':
				controllerFriends.blockFriend(ws, user, state, (text as req_block_user));
				break;
			case 'unblock_user':
				controllerFriends.unBlockFriend(ws, user, state, (text as req_block_user));
				break;
			case 'MultiInviteConfirm':
				controllerPong.confirmInvite(ws, user, state, (text as reponse));
				break;
			case 'MultiInviteRefuse':
				controllerPong.refuseInvite(ws, user, state, (text as reponse));
				break;
			case 'MultiInviteCancel':
				controllerPong.cancelInvite(ws, user, state, (text as reponse));
				break;
			default:
				ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pacman.rooms.actionNotFound')] })); // to close
				break;
		}
	});

	ws.on('close', () => {
		//stopInitConnexionInterval(user.id);
		controllersChat.user_disconnected(ws, user, state);
	});

	ws.on('error', (error: Error) => {
		//stopInitConnexionInterval(user.id);
		controllersChat.removeOnlineUser(state, user);
		if (ws.readyState === WebSocket.OPEN) {
			ws.close(1008, JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('errors.wsError')] }));
		}
	});
}

export default chatWebSocket;
