import { FastifyRequest, FastifyReply } from 'fastify';
import modelFriend from '@models/modelFriends';
import tools from '@tools';
import { randomBytes } from 'crypto';
import { checkInvitePlayer } from '../WebSocket/pongGame/handlers/handleMultiInvite';
import modelUser from '@models/modelUser';
import { getSocketByUserId } from '../WebSocket/chat/wsChat';
import { reponse, State } from '@typesChat';
import { WebSocketServer, WebSocket } from 'ws';
import { User } from '@types';

export const invitePlayer = async (request: FastifyRequest, reply: FastifyReply) => {
	const { friendId } = request.body as { friendId: number };

	const friend = await modelUser.getUserById(friendId);
	if (!friend) {
		return reply.status(404).send({
			message: request.i18n.t('pong.invitePlayer.notFound', { friendId }),
		});
	}

	const isFriend = await modelFriend.checkIsFriend(request.session.user.id, friendId);
	if (!isFriend) {
		return reply.status(403).send({
			message: request.i18n.t('pong.invitePlayer.notFriend'),
		});
	}

	const friendInGame = checkInvitePlayer(friendId);
	if (friendInGame === false) {
		return reply.status(403).send({
			message: request.i18n.t('pong.invitePlayer.alreadyInGame', { username: friend.username }),
		});
	}

	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) {
		return reply.status(403).send({
			message: request.i18n.t('pong.invitePlayer.notOnline', { username: friend.username }),
		});
	}

	const jsonPlayers = {
		userId: request.session.user.id,
		friendId: friendId,
		randomBytes: randomBytes(32).toString('hex'),
		datetime: new Date().toISOString(),
	};
	const encryptedData = tools.encrypt(JSON.stringify(jsonPlayers));
	const url = '/pong/menu/MultiPlayersInvite?data=' + encodeURIComponent(encryptedData);
	friendSocket.send(JSON.stringify({
		action: 'MultiInviteConfirm',
		username: request.session.user.username,
		avatar: request.session.user.avatar,
		url,
		token: encryptedData,
	}));

	return reply.send({
		token: encryptedData,
	});
};

export const confirmInvite = async (ws: WebSocket, user: User, state: State, text: reponse) => {
	const { token } = text as unknown as { token: string };

	if (!token) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.tokenMissing')] }));
		return;
	}

	let decodedData: string | null = null;
	try {
		decodedData = tools.decrypt(token);
	} catch (error) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidToken')] }));
		return;
	}
	if (!decodedData) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidToken')] }));
		return;
	}

	const data = JSON.parse(decodedData);
	if (!data || !data.userId || !data.friendId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	if (user.id !== data.friendId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	const relation = await modelFriend.checkIsFriend(data.userId, data.friendId);
	if (!relation) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.notFriend')] }));
		return;
	}

	const friendId = user.id === data.userId ? data.friendId : data.userId;
	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.notOnline')] }));
		return;
	}

	friendSocket.send(JSON.stringify({
		action: 'MultiInviteRedirect',
		url: '/pong/menu/MultiPlayersInvite?data=' + encodeURIComponent(token)
	}));
};

export const refuseInvite = async (ws: WebSocket, user: User, state: State, text: reponse) => {
	const { token } = text as unknown as { token: string };
	if (!token) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.tokenMissing')] }));
		return;
	}

	let decodedData: string | null = null;
	try {
		decodedData = tools.decrypt(token);
	} catch (error) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidToken')] }));
		return;
	}

	const data = JSON.parse(decodedData);
	if (!data || !data.userId || !data.friendId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	if (user.id !== data.friendId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	const relation = await modelFriend.checkIsFriend(data.userId, data.friendId);
	if (!relation) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.notFriend')] }));
		return;
	}

	const friendId = user.id === data.userId ? data.friendId : data.userId;
	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.notOnline')] }));
		return;
	}

	friendSocket.send(JSON.stringify({
		action: 'MultiInviteRefuse',
		txt: ws.i18n.t('pong.invitePlayer.refused', { username: user.username }),
	}));
};

export const cancelInvite = async (ws: WebSocket, user: User, state: State, text: reponse) => {
	const { token } = text as unknown as { token: string };
	if (!token) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.tokenMissing')] }));
		return;
	}

	let decodedData: string | null = null;
	try {
		decodedData = tools.decrypt(token);
	} catch (error) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidToken')] }));
		return;
	}

	const data = JSON.parse(decodedData);
	if (!data || !data.userId || !data.friendId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	if (user.id !== data.userId) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.invalidData')] }));
		return;
	}

	const relation = await modelFriend.checkIsFriend(data.userId, data.friendId);
	if (!relation) {
		ws.send(JSON.stringify({ action: 'error', result: 'error', notification: [ws.i18n.t('pong.invitePlayer.notFriend')] }));
		return;
	}

	const friendId = user.id === data.userId ? data.friendId : data.userId;
	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) return;
	friendSocket.send(JSON.stringify({
		action: 'MultiInviteCancel',
		txt: ws.i18n.t('pong.invitePlayer.cancelled', { username: user.username }),
	}));
};

export default {
	invitePlayer,
	confirmInvite,
	refuseInvite,
	cancelInvite
};