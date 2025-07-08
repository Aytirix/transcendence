import { Group, User, Friends } from '@types';
import { State, req_accept_friend, res_accept_friend, res_add_friend, req_add_friend, req_remove_friend, res_remove_friend, req_refuse_friend, res_refuse_friend, reponse, req_block_user, res_block_user, req_search_user, res_search_user, res_disconnect, res_leaveGroup, send_friend_connected } from '@typesChat';
import { WebSocket } from 'ws';
import modelsChat from '@models/modelChat';
import modelsFriends from '@models/modelFriends';
import modelsUser from '@models/modelUser';
import controllerChat from './controllerChat';
import { mapToObject } from '@tools';
import i18n from '../i18n';

export const sendToFriend = (friend: User, state: State, data: any) => {
	const ws = state.onlineSockets.get(friend.id);
	const i18nCopy = i18n.cloneInstance({ lng: friend.lang, fallbackLng: 'fr' });
	i18nCopy.changeLanguage(friend.lang);

	if (data.notification && Array.isArray(data.notification)) {
		data.notification = data.notification.map((item: any) => {
			if (typeof item === 'string') {
				return i18nCopy.t(item);
			} else if (item.key && item.params) {
				const translated = i18nCopy.t(item.key, item.params);
				return translated;
			} else if (item.key) {
				return i18nCopy.t(item.key);
			}
			return item;
		});
	} else if (data.notification && typeof data.notification === 'string') {
		data.notification = i18nCopy.t(data.notification);
	} else if (data.notification && data.notification.key) {
		data.notification = i18nCopy.t(data.notification.key, data.notification.params);
	}
	if (friend && friend.id && ws && ws.readyState === ws.OPEN) {
		ws.send(JSON.stringify(data));
	}
}

export const userIsConnected = (user: User, state: State): boolean => {
	if (user && user.id && state.onlineSockets.has(user.id)) {
		const ws = state.onlineSockets.get(user.id);
		if (ws && ws.readyState === ws.OPEN) {
			return true;
		}
	}
	return false;
}

export async function getFriends(userId: number, state: State): Promise<User[]> {
	const friendsIds = await modelsFriends.getFriendsForUser(userId, state);

	if (friendsIds.length === 0) return [];

	// add is connected
	for (const friend of friendsIds) {
		if (friend.relation.status === 'friend' && state.onlineSockets.has(friend.id)) { friend.online = true; }
		else { friend.online = false; }
		if (friend.relation.status === 'blocked' && friend.relation.target === userId) {
			friendsIds.splice(friendsIds.indexOf(friend), 1);
			continue;
		}
	}

	friendsIds.sort((a, b) => {
		if (a.online && !b.online) return -1;
		if (!a.online && b.online) return 1;
		if (a.relation.status === 'pending' && b.relation.status !== 'pending') return -1;
		if (a.relation.status !== 'pending' && b.relation.status === 'pending') return 1;
		if (a.relation.status === 'blocked' && b.relation.status !== 'blocked') return 1;
		if (a.relation.status !== 'blocked' && b.relation.status === 'blocked') return -1;

		return 0;
	});

	return friendsIds;
}

export function getRelationFriend(user_id: number, friend_id: number, state: State): Friends | undefined {
	let relation: Friends | undefined;
	for (const friend of state.friends.values()) {
		if ((friend.user_one_id === user_id && friend.user_two_id === friend_id) ||
			(friend.user_one_id === friend_id && friend.user_two_id === user_id)) {
			relation = friend;
			break;
		}
	}
	return relation;
}

/**
 * Vérifie si un utilisateur est bloqué par un autre utilisateur ou s'il a bloqué un autre utilisateur.
 *
 * @param ws - Instance de WebSocket utilisée pour envoyer des notifications à l'utilisateur.
 * @param user - L'utilisateur actuel effectuant l'action.
 * @param friend - L'utilisateur ami ou cible de l'action.
 * @param state - L'état global contenant les relations d'amitié.
 * @param shouldBlock - Indique si une notification doit être envoyée en cas de blocage.
 * @returns `true` si l'utilisateur est bloqué ou a bloqué l'autre utilisateur, sinon `false`.
 */
export function userIsBlocked(ws: WebSocket, user: User, friend: User, state: State, shouldBlock: boolean): boolean {
	const relation = getRelationFriend(user.id, friend.id, state);

	if (relation && relation.status === 'blocked' && relation.target === user.id) {
		if (shouldBlock) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.userBlockedYouNotification', { username: friend.username }) } as reponse));
		}
		return true;
	}

	if (relation && relation.status === 'blocked' && relation.target === friend.id) {
		if (shouldBlock) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.youBlockedUserNotification', { username: friend.username }) } as reponse));
		}
		return true;
	}

	if (!shouldBlock) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.notBlocked', { username: friend.username }) } as reponse));
	}

	return false;
}

export const searchUser = async (ws: WebSocket, user: User, state: State, text: req_search_user) => {
	const { name, group_id } = text;
	let users: User[] = [];
	if (name && name.length >= 1 && name.length <= 15) {
		users = await modelsUser.searchUser(name);
		const userIds = Array.from(state.user.keys());
		if (users.length === 0) {
			return;
		}
	}

	// filtrer les utilisateurs pour ne pas afficher l'utilisateur lui-même et ceux qui sont déjà amis
	users = users.filter((userSearch) => {
		let relation = getRelationFriend(user.id, userSearch.id, state);
		if (!relation) {
			relation = {
				id: -1,
				user_one_id: user.id,
				user_two_id: userSearch.id,
				status: '',
				target: null,
				group_id: null,
			}
		}
		userSearch.relation = relation;
		if (userSearch.id === user.id) return false;
		if (group_id) {
			const group = controllerChat.groupExists(ws, state, group_id);
			if (!group) return false;
			if (!controllerChat.userIsOwnerGroup(ws, user, group)) return false;
			if (!controllerChat.userInGroup(ws, user, group)) return false;
			if (!controllerChat.userInGroup(ws, user, group)) return false;
			if (controllerChat.userInGroup(ws, userSearch, group)) return false;
			if (relation && relation.status === 'blocked') return false;
		}
		else {
			if (relation && relation.status === 'blocked' && relation.target === user.id) return false;
		}
		return true;
	});

	// trier et mettre dans cette ordre amis en ligne, amis hors ligne, en attente, no relation, blocked
	users.sort((a, b) => {
		if (a.online && !b.online) return -1;
		if (!a.online && b.online) return 1;
		if (a.relation.status === 'pending' && b.relation.status !== 'pending') return -1;
		if (a.relation.status !== 'pending' && b.relation.status === 'pending') return 1;
		if (a.relation.status === 'blocked' && b.relation.status !== 'blocked') return 1;
		if (a.relation.status !== 'blocked' && b.relation.status === 'blocked') return -1;

		return 0;
	});

	ws.send(JSON.stringify({
		action: 'search_user',
		result: 'ok',
		users,
	} as res_search_user));
}

export const addFriend = async (ws: WebSocket, user: User, state: State, text: req_add_friend) => {
	const { user_id } = text;
	if (!user_id) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));
		return;
	}

	const friend = await modelsUser.getUserById(user_id);
	if (!friend) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.userNotExist') } as reponse));
	if (friend.id === user.id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.cannotAddYourself') } as reponse));

	const relation = getRelationFriend(user.id, friend.id, state);
	if (relation) {
		switch (relation.status) {
			case 'friend':
				const msg = ws.i18n.t('RelationFriends.alreadyFriend', { username: friend.username });
				ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [msg] } as reponse));
				return;
			case 'blocked':
				if (relation.target === user.id) {
					const msg = ws.i18n.t('RelationFriends.userBlockedYou', { username: friend.username });
					ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [msg] } as reponse));
				}
				else if (relation.target === friend.id) {
					const msg = ws.i18n.t('RelationFriends.youBlockedUser', { username: friend.username });
					ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [msg] } as reponse));
				}
				return;
			case 'pending':
				if (relation.target === user.id) {
					const msg = ws.i18n.t('RelationFriends.friendAlreadySentRequest', { username: friend.username });
					ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [msg] } as reponse));
				}
				else if (relation.target === friend.id) {
					const msg = ws.i18n.t('RelationFriends.youAlreadySentRequest', { username: friend.username });
					ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [msg] } as reponse));
				}
				return;
		}
	}

	if (await modelsFriends.updateFriendRelation(user, friend, 'pending', null, state) == false) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSendingRequest') } as reponse));

	sendToFriend(friend, state, {
		action: 'add_friend',
		result: 'ok',
		targetId: friend.id,
		user: {
			id: user.id,
			username: user.username,
			avatar: user.avatar,
			lang: user.lang,
			online: user.online
		},
		notification: [{ key: 'RelationFriends.receivedFriendRequest', params: { username: user.username } }]
	} as res_add_friend);

	const msg = ws.i18n.t('RelationFriends.sentFriendRequest', { username: friend.username });
	ws.send(JSON.stringify({
		action: 'add_friend',
		result: 'ok',
		targetId: friend.id,
		user: {
			id: friend.id,
			username: friend.username,
			avatar: friend.avatar,
			lang: friend.lang,
			online: friend.online
		},
		notification: [msg],
	} as res_add_friend));
}

export const removeFriend = async (ws: WebSocket, user: User, state: State, text: req_remove_friend) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const friend = await modelsUser.getUserById(user_id);
	if (!friend) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.userNotExist') } as reponse));

	const relation = getRelationFriend(user.id, friend.id, state);
	if (!relation) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.noRelationWithUser') } as reponse));

	switch (relation.status) {
		case 'friend':
			if (await modelsFriends.updateFriendRelation(user, friend, '', false, state) == false) {
				ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorRemoveFriend') } as reponse));
				break;
			}

			sendToFriend(friend, state, {
				action: 'remove_friend',
				user_id: user.id,
				group_id: relation.group_id,
				result: 'ok',
				notification: [{ key: 'RelationFriends.friendRemovedYou', params: { username: user.username } }],
			} as res_remove_friend);
			sendToFriend(friend, state, {
				action: 'leave_group',
				result: 'ok',
				group_id: relation.group_id,
				user_id: user.id,
			} as res_leaveGroup);


			ws.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: relation.group_id, user_id: friend.id } as res_leaveGroup));
			ws.send(JSON.stringify({
				action: 'remove_friend',
				user_id: friend.id,
				group_id: relation.group_id,
				result: 'ok',
				notification: ws.i18n.t('RelationFriends.youRemovedFriend', { username: friend.username }),
			} as res_remove_friend));
			break;
	}
}

export const acceptFriend = async (ws: WebSocket, user: User, state: State, text: req_accept_friend) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const relation = getRelationFriend(user.id, user_id, state);
	if (!relation) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.noRelationWithUser') } as reponse));

	if (relation.status === 'pending' && relation.target === user.id) {
		const friend = await modelsUser.getUserById(user_id);
		friend.online = userIsConnected(friend, state);
		let groupPrivMsg: Group | null = await modelsChat.createPrivateGroup(user, friend, state);
		if (groupPrivMsg == null) {
			console.log('Error creating private group');
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t(`RelationFriends.errorCreatePrivateGroup`) } as reponse));
			return;
		}
		if (await modelsFriends.updateFriendRelation(user, friend, 'friend', groupPrivMsg.id, state) == false) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t(`RelationFriends.errorAcceptRequest`) } as reponse));
			return;
		}
		if (friend) {
			ws.send(JSON.stringify({
				action: 'accept_friend',
				result: 'ok',
				user_id: friend.id,
				isConnected: true,
				group: groupPrivMsg,
				notification: ws.i18n.t('RelationFriends.acceptedFriendRequestYou', { username: friend.username }),
			} as res_accept_friend));
		}
		sendToFriend(friend, state, {
			action: 'accept_friend',
			result: 'ok',
			user_id: user.id,
			isConnected: true,
			group: groupPrivMsg,
			notification: [{ key: 'RelationFriends.acceptedFriendRequest', params: { username: user.username } }],
		} as res_accept_friend);
	}
}

export const refuseFriend = async (ws: WebSocket, user: User, state: State, text: req_refuse_friend) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const relation = getRelationFriend(user.id, user_id, state);
	if (!relation) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.noRelationWithUser') } as reponse));

	if (relation.status === 'pending' && relation.target === user.id) {
		const friend = await modelsUser.getUserById(user_id);
		let groupPrivMsg: Group | null = await modelsChat.createPrivateGroup(user, friend, state);
		if (groupPrivMsg == null) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t(`RelationFriends.errorCreatePrivateGroup`) } as reponse));
			return;
		}
		if (await modelsFriends.updateFriendRelation(user, friend, '', groupPrivMsg.id, state) == false) {
			ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t(`RelationFriends.errorRefuseRequest`) } as reponse));
			return;
		}
		if (friend) {
			ws.send(JSON.stringify({
				action: 'refuse_friend',
				user_id: friend.id,
				group_id: groupPrivMsg.id,
				result: 'ok',
				notification: ws.i18n.t('RelationFriends.refusedFriendRequestYou', { username: friend.username }),
			} as res_refuse_friend));
		}
		sendToFriend(friend, state, {
			action: 'refuse_friend',
			user_id: user.id,
			group_id: groupPrivMsg.id,
			result: 'ok',
			notification: [{ key: 'RelationFriends.refusedFriendRequest', params: { username: user.username } }],
		} as res_refuse_friend);
	}
}

export const cancelFriend = async (ws: WebSocket, user: User, state: State, text: req_refuse_friend) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const relation = getRelationFriend(user.id, user_id, state);
	if (!relation) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.noRelationWithUser') } as reponse));

	if (relation.status === 'pending' && relation.target !== user.id) {
		const friend = await modelsUser.getUserById(user_id);
		if (await modelsFriends.updateFriendRelation(user, friend, '', false, state) == false) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t(`RelationFriends.errorRefuseRequest`) } as reponse));

		if (friend) {
			ws.send(JSON.stringify({
				action: 'refuse_friend',
				result: 'ok',
				user_id: friend.id,
				group_id: relation.group_id,
				notification: ws.i18n.t('RelationFriends.canceledRequestYou', { username: friend.username }),
			} as res_refuse_friend));
		}
		sendToFriend(friend, state, {
			action: 'refuse_friend',
			result: 'ok',
			user_id: user.id,
			group_id: relation.group_id,
			notification: [{ key: 'RelationFriends.canceledRequest', params: { username: user.username } }],
		} as res_refuse_friend);
	}
}

export const blockFriend = async (ws: WebSocket, user: User, state: State, text: req_block_user) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const friend = await modelsUser.getUserById(user_id);
	if (userIsBlocked(ws, user, friend, state, true)) return;

	if (await modelsFriends.updateFriendRelation(user, friend, 'blocked', false, state) == false) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorBlockingUser') } as reponse));

	const relation = getRelationFriend(user.id, friend.id, state);
	ws.send(JSON.stringify({ action: 'friend_disconnected', user_id: friend.id } as res_disconnect));
	ws.send(JSON.stringify({
		action: 'block_user',
		result: 'ok',
		targetId: friend.id,
		user_id: friend.id,
		group_id: relation.group_id,
		notification: ws.i18n.t('RelationFriends.youBlockedUserNotification', { username: friend.username }),
	} as res_block_user));
	sendToFriend(friend, state, {
		action: 'block_user',
		result: 'ok',
		targetId: friend.id,
		user_id: user.id
	} as res_block_user);
}

export const unBlockFriend = async (ws: WebSocket, user: User, state: State, text: req_block_user) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const friend = await modelsUser.getUserById(user_id);

	if (!userIsBlocked(ws, user, friend, state, false)) return;

	const relation = getRelationFriend(user.id, friend.id, state);
	if (!relation) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.noRelationWithUser') } as reponse));

	if (relation.target === user.id) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.cannotUnblockUserWhoBlockedYou', { username: friend.username }) } as reponse));
		return;
	}

	if (await modelsFriends.updateFriendRelation(user, friend, '', false, state) == false) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorUnblockingUser') } as reponse));

	ws.send(JSON.stringify({
		action: 'unblock_user',
		result: 'ok',
		user_id: friend.id,
		notification: ws.i18n.t('RelationFriends.youUnblockedUserNotification', { username: friend.username }),
	} as res_block_user));
	sendToFriend(friend, state, {
		action: 'unblock_user',
		result: 'ok',
		user_id: user.id
	} as res_block_user);
}

export default {
	userIsConnected,
	getFriends,
	getRelationFriend,
	userIsBlocked,
	searchUser,
	addFriend,
	acceptFriend,
	removeFriend,
	refuseFriend,
	cancelFriend,
	blockFriend,
	unBlockFriend,
};