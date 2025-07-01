import { Group, User, Friends } from '@types';
import { State, req_accept_friend, res_accept_friend, res_add_friend, req_add_friend, req_remove_friend, res_remove_friend, req_refuse_friend, res_refuse_friend, reponse, req_block_user, res_block_user, req_search_user, res_search_user } from '@typesChat';
import { WebSocket } from 'ws';
import modelsChat from '@models/modelChat';
import modelsFriends from '@models/modelFriends';
import modelsUser from '@models/modelUser';
import controllerChat from './controllerChat';
import { mapToObject } from '@tools';

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
		if (state.onlineSockets.has(friend.id)) { friend.online = true; }
		else { friend.online = false; }
		if (friend.relation.status === 'blocked' && friend.relation.target === userId) {
			friendsIds.splice(friendsIds.indexOf(friend), 1);
			continue;
		}
	}
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
			console.log(`status: ${relation?.status}, target: ${relation?.target}, user.id: ${user.id}, userSearch.id: ${userSearch.id}`);
			if (relation && relation.status === 'blocked' && relation.target === user.id) return false;
		}
		return true;
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

	const wsFriend = state.onlineSockets.get(friend.id);
	if (wsFriend) {
		wsFriend.send(JSON.stringify({
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
			notification: [ws.i18n.t('RelationFriends.receivedFriendRequest', { username: user.username })],
		} as res_add_friend));
	}

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
			const wsFriend = state.onlineSockets.get(friend.id);
			if (wsFriend) {
				wsFriend.send(JSON.stringify({
					action: 'remove_friend',
					user_id: user.id,
					group_id: relation.group_id,
					result: 'ok',
					notification: ws.i18n.t('RelationFriends.friendRemovedYou', { username: user.username }),
				} as res_remove_friend));
			}
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
	console.log('end getRelationFriend', relation);

	if (relation.status === 'pending' && relation.target === user.id) {
		const friend = await modelsUser.getUserById(user_id);
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
		console.log('state after updateFriendRelation', JSON.stringify(mapToObject(state.friends)));
		console.log('groupPrivMsg after updateFriendRelation', JSON.stringify(mapToObject(state.groups)));
		if (friend) {
			ws.send(JSON.stringify({
				action: 'accept_friend',
				result: 'ok',
				user_id: friend.id,
				isConnected: userIsConnected(user, state),
				group: groupPrivMsg,
				notification: ws.i18n.t('RelationFriends.acceptedFriendRequestYou', { username: friend.username }),
			} as res_accept_friend));
		}
		const wsFriend = state.onlineSockets.get(friend.id);
		if (wsFriend) {
			wsFriend.send(JSON.stringify({
				action: 'accept_friend',
				result: 'ok',
				user_id: user.id,
				isConnected: userIsConnected(friend, state),
				group: groupPrivMsg,
				notification: ws.i18n.t('RelationFriends.acceptedFriendRequest', { username: user.username }),
			} as res_accept_friend));
		}
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
		const wsFriend = state.onlineSockets.get(friend.id);
		if (wsFriend) {
			wsFriend.send(JSON.stringify({
				action: 'refuse_friend',
				user_id: user.id,
				group_id: groupPrivMsg.id,
				result: 'ok',
				notification: ws.i18n.t('RelationFriends.refusedFriendRequest', { username: user.username }),
			} as res_refuse_friend));
		}
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
		const wsFriend = state.onlineSockets.get(friend.id);
		if (wsFriend) {
			wsFriend.send(JSON.stringify({
				action: 'refuse_friend',
				result: 'ok',
				user_id: user.id,
				group_id: relation.group_id,
				notification: ws.i18n.t('RelationFriends.canceledRequest', { username: user.username }),
			} as res_refuse_friend));
		}
	}
}

export const blockFriend = async (ws: WebSocket, user: User, state: State, text: req_block_user) => {
	const { user_id } = text;
	if (!user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorSpecifyUserId') } as reponse));

	const friend = await modelsUser.getUserById(user_id);
	if (userIsBlocked(ws, user, friend, state, true)) return;

	if (await modelsFriends.updateFriendRelation(user, friend, 'blocked', false, state) == false) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: ws.i18n.t('RelationFriends.errorBlockingUser') } as reponse));

	const relation = getRelationFriend(user.id, friend.id, state);
	ws.send(JSON.stringify({
		action: 'block_user',
		result: 'ok',
		user_id: friend.id,
		group_id: relation.group_id,
		notification: ws.i18n.t('RelationFriends.youBlockedUserNotification', { username: friend.username }),
	} as res_block_user));
	const wsFriend = state.onlineSockets.get(friend.id);
	if (wsFriend) {
		wsFriend.send(JSON.stringify({
			action: 'block_user',
			result: 'ok',
			targetId: friend.id,
			user_id: user.id,
		} as res_block_user));
	}
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
	const wsFriend = state.onlineSockets.get(friend.id);
	console.log('wsFriend', wsFriend);
	if (wsFriend) {
		wsFriend.send(JSON.stringify({
			action: 'unblock_user',
			result: 'ok',
			user_id: user.id,
		} as res_block_user));
	}
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