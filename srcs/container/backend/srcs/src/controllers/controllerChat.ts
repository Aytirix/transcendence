import { Friends, Group, Message, User } from '@types';
import { send_friend_connected, res_disconnect, req_newMessage, res_newMessage, State, send_init_connected, req_loadMoreMessage, res_loadMoreMessage, reponse, req_createGroup, res_createGroup, req_addUserGroup, res_addUserGroup, req_deleteGroup, req_leaveGroup, res_leaveGroup } from '@typesChat';
import { WebSocketServer, WebSocket } from 'ws';
import modelsChat from '@models/modelChat';
import modelsFriends from '@models/modelFriends';
import { IncomingMessage } from 'http';
import controllerFriends from './controllerFriends';
import { mapToObject } from '@tools';
import modelUser from '@models/modelUser';

/*
 * Vérifie si le groupe existe
 * @param wsSender WebSocket de l'utilisateur
 * @param state État de l'application
 * @param group_id ID du groupe à vérifier
 * @returns Le groupe si trouvé, sinon false
*/
export function groupExists(ws: WebSocket, state: State, group_id: number): Group | false {
	const group = state.groups.get(group_id);
	if (!group) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.groupNotFound')] } as reponse));
		return false;
	}
	return group;
}

/*
 * Vérifie si l'utilisateur est membre du groupe
 * @param userws WebSocket de l'utilisateur
 * @param group Groupe à vérifier
 * @returns true si l'utilisateur est membre du groupe, false sinon
*/
export function userInGroup(ws: WebSocket, user: User, group: Group, send: boolean = true): boolean {
	const res: boolean = group.members.some((member: User) => member.id === user.id);
	if (!res) {
		if (send) ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.notMemberOfGroup')] } as reponse));
		return false;
	}
	return true;
}

/*
 * Vérifie si l'utilisateur est owner du groupe
 * @param userws WebSocket de l'utilisateur
 * @param group Groupe à vérifier
 * @returns true si l'utilisateur est membre du groupe, false sinon
*/
export function userIsOwnerGroup(ws: WebSocket, user: User, group: Group, send: boolean = true): boolean {
	if (!userInGroup(ws, user, group, send)) return false;
	for (const owner_id of group.owners_id) {
		if (owner_id === user.id) {
			return true;
		}
	}
	if (send) ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.notOwnerOfGroup')] } as reponse));
	return false;
}

export function broadcastAllGroupUsers(user: User, state: State, group: Group, text: unknown) {
	let send: number[] = [];
	for (const [, group] of state.groups) {
		const members = group.members.filter(member => member.id !== user.id);
		members.forEach(member => {
			const relation = controllerFriends.getRelationFriend(user.id, member.id, state);
			if (relation && relation.status === 'blocked') return;
			const wsMember = state.onlineSockets.get(member.id);
			if (wsMember && wsMember.readyState === WebSocket.OPEN && send.indexOf(member.id) === -1) {
				send.push(member.id);
				wsMember.send(text as string);
			}
		});
	}
}

export const addOnlineUser = (state: State, ws: WebSocket, user: User) => {
	if (!state.user.has(user.id)) {
		state.user.set(user.id, user);
	}
	const userToUpdate = state.user.get(user.id);
	if (userToUpdate) {
		userToUpdate.online = true;
	}
	state.onlineSockets.set(user.id, ws);
	state.groups.forEach((group: Group) => {
		if (group.members.some(member => member.id === user.id)) {
			if (!group.onlines_id.includes(user.id)) {
				group.onlines_id.push(user.id);
			}
		}
	});
};

export const removeOnlineUser = (state: State, user: User) => {
	const userToUpdate = state.user.get(user.id);
	if (userToUpdate) {
		userToUpdate.online = false;
	}
	state.onlineSockets.delete(user.id);

	state.user.forEach((user: User) => {
		if (!state.onlineSockets.has(user.id)) {
			state.user.delete(user.id);
		}
	});
	state.groups.forEach((group: Group) => {
		if (group.onlines_id.includes(user.id)) {
			group.onlines_id = group.onlines_id.filter(id => id !== user.id);
		}
	});
};

export const BlockedUserId = (user: User, state: State) => {
	const blockedUsers = Array.from(state.friends.values()).filter(friend => (friend.user_one_id === user.id || friend.user_two_id === user.id) && friend.status === 'blocked');
	const blockedUserIds = blockedUsers.map(friend => friend.user_one_id === user.id ? friend.user_two_id : friend.user_one_id);
	return blockedUserIds;
}

export const filterBlockedUserMessages = (messages: Map<number, Message>, user: User, state: State): Map<number, Message> => {
	const blockedUserIds = BlockedUserId(user, state);
	return new Map(Array.from(messages.values())
		.filter(message => !blockedUserIds.includes(message.sender_id))
		.map(message => [message.id, message]));
}

export const init_connexion = async (ws: WebSocket, user: User, state: State) => {
	addOnlineUser(state, ws, user);
	await modelsChat.getAllGroupsFromUser(user, state);

	// Envoi de l'information de connexion à tous les amis connectés
	const friends = await controllerFriends.getFriends(user.id, state);

	broadcastAllGroupUsers(user, state, null, JSON.stringify({ action: 'friend_connected', user_id: user.id } as send_friend_connected));

	// recuprer les groupes de l'utilisateur
	const userGroups = new Map(
		Array.from(state.groups.entries()).filter(([_, group]: [number, Group]) => {
			let isFriend = false;
			group.messages = filterBlockedUserMessages(group.messages, user, state);
			for (const member of group.members) {
				if (member.id !== user.id) {
					const relation = controllerFriends.getRelationFriend(user.id, member.id, state);
					if (relation && relation.status === 'friend') isFriend = true;
					break;
				}
			}
			if (!group.private) return userInGroup(ws, user, group, false);
			if (group.private && isFriend) return userInGroup(ws, user, group, false);
			return false;
		})
	);
	// Envoi de la liste des groupes et utilisateurs connectés à l'utilisateur
	const send: send_init_connected = {
		action: 'init_connected',
		result: 'ok',
		user: { ...user },
		groups: mapToObject(userGroups),
		friends: friends.map(friend => ({ ...friend, email: undefined })), // Remove email from each friend
	};

	Object.values(send.groups).forEach(group => {
		group.members = group.members.map((member: User) => ({ ...member, email: undefined }));
	});
	ws.send(JSON.stringify(send));
};

export const user_disconnected = async (ws: WebSocket, user: User, state: State) => {
	broadcastAllGroupUsers(user, state, null, JSON.stringify({ action: 'friend_disconnected', user_id: user.id } as res_disconnect));
	removeOnlineUser(state, user);
};

export const newMessage = async (ws: WebSocket, user: User, state: State, req: req_newMessage) => {
	const sentAtDate = new Date();
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;

	if (!userInGroup(ws, user, group)) return;
	if (!req.message || req.message.length < 1) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.messageMissing')] } as reponse));
	if (req.message.length > 1000) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.messageTooLong')] } as reponse));

	const newMessage = await modelsChat.newMessage(group, user, req.message, sentAtDate);
	if (!newMessage) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorSendingMessage')] } as reponse));
		return;
	}

	group.messages.set(newMessage.id, newMessage);
	const messageToSend: res_newMessage = {
		action: 'new_message',
		result: 'ok',
		group_id: group.id,
		message: newMessage,
	};

	const listUserIdBlocked = BlockedUserId(user, state);
	group.members.forEach((member: User) => {
		if (listUserIdBlocked.includes(member.id)) return;
		const wsMember = state.onlineSockets.get(member.id);
		if (wsMember && wsMember.readyState === WebSocket.OPEN) {
			wsMember.send(JSON.stringify(messageToSend));
		}
	});
};

export const loadMoreMessage = async (ws: WebSocket, user: User, state: State, req: req_loadMoreMessage) => {
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;
	if (!userInGroup(ws, user, group)) return;
	if (req.firstMessageId < 0) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.messageIdMissing')] } as reponse));

	if (req.firstMessageId > 0 && !group.messages.has(req.firstMessageId)) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.messageNotFound')] } as reponse));

	const listUserIdBlocked = BlockedUserId(user, state);

	let lstMsgId = req.firstMessageId === 0 ? null : req.firstMessageId;

	const messagesFromDb = await modelsChat.getMessagesFromGroup(group, 20, listUserIdBlocked, lstMsgId);

	ws.send(JSON.stringify({ action: 'loadMoreMessage', result: 'ok', group_id: group.id, messages: mapToObject(messagesFromDb) } as res_loadMoreMessage));
}

export const createGroup = async (ws: WebSocket, user: User, state: State, req: req_createGroup) => {
	if (!req.group_name) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.groupNameMissing')] } as reponse));
	if (req.group_name.length > 25) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.groupNameTooLong')] } as reponse));
	req.users_id = req.users_id.filter((id: number) => id !== user.id);
	if (req.users_id.length < 1) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.mustAddAtLeastOneUser')] } as reponse));

	const users: User[] = [];
	for (const userId of req.users_id) {
		const userToAdd = state.user.get(userId) || await modelUser.getUserById(userId);
		if (!userToAdd) continue;
		let relation: Friends | undefined;
		state.friends.forEach(friend => {
			if ((friend.user_one_id === user.id && friend.user_two_id === userId) ||
				(friend.user_one_id === userId && friend.user_two_id === user.id)) relation = friend;
		});
		if (!relation || relation.status !== 'blocked') users.push(userToAdd);
	}
	const group = await modelsChat.createPublicGroup(user, req.group_name, users, state);

	if (!group) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorCreatingGroup')] } as reponse));

	ws.send(JSON.stringify({ action: 'create_group', result: 'ok', group: group, notification: [ws.i18n.t('Chat.groupCreated', { groupName: group.name })] } as res_createGroup));
	for (const userToNotify of users) {
		const wsMember = state.onlineSockets.get(userToNotify.id);
		if (wsMember && wsMember.readyState === WebSocket.OPEN) {
			wsMember.send(JSON.stringify({ action: 'create_group', result: 'ok', group: group, notification: [ws.i18n.t('Chat.addedToGroup', { username: user.username, groupName: group.name })] } as res_createGroup));
		}
	}
}

export const addUserGroup = async (ws: WebSocket, user: User, state: State, req: req_addUserGroup) => {
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;

	if (!userIsOwnerGroup(ws, user, group)) return;

	if (group.private) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.cannotAddToPrivateGroup')] } as reponse));

	if (!req.user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userIdMissing')] } as reponse));

	const userToAdd = state.user.get(req.user_id) || await modelUser.getUserById(req.user_id);
	if (!userToAdd) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userNotFound')] } as reponse));

	if (controllerFriends.userIsBlocked(ws, user, userToAdd, state, true)) return;

	if (group.members.some((member: User) => member.id === userToAdd.id)) {
		return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userAlreadyInGroup', { username: userToAdd.username, groupName: group.name })] } as reponse));
	}

	const added = await modelsChat.addUserToGroup(group, userToAdd, state, false);
	if (!added) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorAddingUserToGroup', { username: userToAdd.username })] } as reponse));
		return;
	}
	ws.send(JSON.stringify({ action: 'add_user_group', result: 'ok', group_id: group.id, user: userToAdd, notification: [ws.i18n.t('Chat.userAddedToGroup', { username: userToAdd.username, groupName: group.name })] } as res_addUserGroup));

	// Envoi de la notification à tout les membres du groupe sauf l'utilisateur qui a ajouté
	group.members.forEach((member: User) => {
		if (member.id !== userToAdd.id && member.id !== user.id) {
			const wsMember = state.onlineSockets.get(member.id);
			if (wsMember && wsMember.readyState === WebSocket.OPEN) {
				wsMember.send(JSON.stringify({ action: 'add_user_group', result: 'ok', group_id: group.id, user: userToAdd, notification: [ws.i18n.t('Chat.userAddedToGroupNotification', { username: userToAdd.username, groupName: group.name })] } as res_addUserGroup));
			}
		}
	});

	const wsMember = state.onlineSockets.get(userToAdd.id);
	if (wsMember && wsMember.readyState === WebSocket.OPEN) {
		wsMember.send(JSON.stringify({ action: 'create_group', result: 'ok', group: group, notification: [ws.i18n.t('Chat.addedToGroup', { username: user.username, groupName: group.name })] } as res_createGroup));
	}
}

export const removeUserGroup = async (ws: WebSocket, user: User, state: State, req: req_addUserGroup) => {
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;

	if (user.id === req.user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.cannotRemoveYourself')] } as reponse));

	if (!userIsOwnerGroup(ws, user, group)) return;

	if (group.private) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.cannotRemoveFromPrivateGroup')] } as reponse));

	if (!req.user_id) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userIdMissing')] } as reponse));

	const userToRemove = state.user.get(req.user_id) || await modelUser.getUserById(req.user_id);
	if (!userToRemove) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userNotFound')] } as reponse));

	if (!group.members.some((member: User) => member.id === userToRemove.id)) {
		return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.userNotInGroup', { username: userToRemove.username, groupName: group.name })] } as reponse));
	}

	const added = await modelsChat.removeUserFromGroup(group, userToRemove);
	if (!added) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorRemovingUserFromGroup', { username: userToRemove.username, groupName: group.name })] } as reponse));

	ws.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: userToRemove.id, notification: [ws.i18n.t('Chat.userRemovedFromGroup', { username: userToRemove.username, groupName: group.name })] } as res_leaveGroup));

	// Envoi de la notification à tout les membres du groupe sauf l'utilisateur qui a ajouté
	group.members.forEach((member: User) => {
		if (member.id !== userToRemove.id && member.id !== user.id) {
			const wsMember = state.onlineSockets.get(member.id);
			if (wsMember && wsMember.readyState === WebSocket.OPEN) {
				wsMember.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: userToRemove.id, notification: [ws.i18n.t('Chat.userRemovedFromGroupNotification', { username: userToRemove.username, groupName: group.name })] } as res_leaveGroup));
			}
		}
	});

	const wsMember = state.onlineSockets.get(userToRemove.id);
	if (wsMember && wsMember.readyState === WebSocket.OPEN) {
		wsMember.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: userToRemove.id, notification: [ws.i18n.t('Chat.removedFromGroup', { username: user.username, groupName: group.name })] } as res_leaveGroup));
	}
}

export const leaveGroup = async (ws: WebSocket, user: User, state: State, req: req_leaveGroup) => {
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;

	if (!userInGroup(ws, user, group)) return;

	const added = await modelsChat.removeUserFromGroup(group, user);
	if (!added) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorLeavingGroup', { groupName: group.name })] } as reponse));

	ws.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: user.id, notification: [ws.i18n.t('Chat.leftGroup', { groupName: group.name })] } as res_leaveGroup));

	group.members.forEach((member: User) => {
		if (member.id !== user.id) {
			const wsMember = state.onlineSockets.get(member.id);
			if (wsMember && wsMember.readyState === WebSocket.OPEN) {
				wsMember.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: user.id, notification: [ws.i18n.t('Chat.userLeftGroup', { username: user.username, groupName: group.name })] } as res_leaveGroup));
			}
		}
	});
}

export const deleteGroup = async (ws: WebSocket, user: User, state: State, req: req_deleteGroup) => {
	const group = groupExists(ws, state, req.group_id);
	if (!group) return;
	
	leaveGroup(ws, user, state, { action: 'leave_group', group_id: group.id });
	return;

	// if (!userIsOwnerGroup(ws, user, group)) return ;

	// if (group.private) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.cannotDeletePrivateGroup')] } as reponse));

	// const del = await modelsChat.deleteGroup(group.id, state);
	// if (!del) return ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('Chat.errorDeletingGroup', { groupName: group.name })] } as reponse));

	// ws.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: user.id, notification: [ws.i18n.t('Chat.groupDeleted', { groupName: group.name })] } as res_leaveGroup));

	// group.members.forEach((member: User) => {
	// 	if (member.id !== user.id) {
	// 		const wsMember = state.onlineSockets.get(member.id);
	// 		if (wsMember && wsMember.readyState === WebSocket.OPEN) {
	// 			wsMember.send(JSON.stringify({ action: 'leave_group', result: 'ok', group_id: group.id, user_id: user.id, notification: [ws.i18n.t('Chat.groupDeletedByUser', { username: user.username, groupName: group.name })] } as res_leaveGroup));
	// 		}
	// 	}
	// });
}

export default {
	init_connexion,
	groupExists,
	userInGroup,
	userIsOwnerGroup,
	user_disconnected,
	newMessage,
	loadMoreMessage,
	addOnlineUser,
	removeOnlineUser,
	createGroup,
	addUserGroup,
	removeUserGroup,
	leaveGroup,
	deleteGroup,
};