import { FastifyRequest, FastifyReply } from 'fastify';
import modelFriend from '@models/modelFriends';
import tools from '@tools';
import { randomBytes } from 'crypto';
import { checkInvitePlayer } from '../WebSocket/pongGame/handlers/handleMultiInvite';
import modelUser from '@models/modelUser';
import modelPong from '@models/modelPong';
import { getSocketByUserId } from '../WebSocket/chat/wsChat';
import { reponse, State } from '@typesChat';
import { WebSocketServer, WebSocket } from 'ws';
import { User } from '@types';

// Tableau pour limiter les invitations - stocke les dernières invitations par paire d'utilisateurs
// Clé: "userId_friendId", Valeur: timestamp de la dernière invitation
const inviteThrottleMap = new Map<string, number>();
const INVITE_COOLDOWN = 3000; // 30 secondes en millisecondes

// Fonction pour nettoyer les entrées expirées du tableau
const cleanExpiredThrottleEntries = () => {
	const now = Date.now();
	for (const [key, timestamp] of inviteThrottleMap.entries()) {
		if (now - timestamp > INVITE_COOLDOWN) {
			inviteThrottleMap.delete(key);
		}
	}
};

export const getStatForPlayer = async (request: FastifyRequest, reply: FastifyReply) => {
	const playerStats = await modelPong.getStatisticsForUser(request.session.user.id);
	return reply.send(playerStats);
};

export const invitePlayer = async (request: FastifyRequest, reply: FastifyReply) => {
	const { friendId } = request.body as { friendId: number };


	const friend = await modelUser.getUserById(friendId);
	if (!friend) {
		return reply.status(404).send({
			message: request.i18n.t('pong.invitePlayer.notFound', { friendId }),
		});
	}

	// Nettoyer les entrées expirées
	cleanExpiredThrottleEntries();

	// Vérifier la limitation d'invitation
	const throttleKey = `${request.session.user.id}_${friendId}`;
	const lastInviteTime = inviteThrottleMap.get(throttleKey);
	const now = Date.now();
	if (lastInviteTime && (now - lastInviteTime) < INVITE_COOLDOWN) {
		const remainingTime = Math.ceil((INVITE_COOLDOWN - (now - lastInviteTime)) / 1000);
		console.log(`lang ${request.i18n.lang} - ${request.session.user.lang}`);
		return reply.status(429).send({
			message: request.i18n.t('pong.invitePlayer.tooFrequent', {
				username: friend.username,
				seconds: remainingTime
			}),
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

	if ((await modelPong.checkUserIsInvited(friendId, request.session.user.id))) {
		return reply.status(403).send({
			message: request.i18n.t('pong.invitePlayer.alreadyInvited', { username: friend.username }),
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

	await modelPong.insertTokenInvite(request.session.user.id, friendId, encryptedData, Date.now());

	friendSocket.send(JSON.stringify({
		action: 'MultiInviteConfirm',
		username: request.session.user.username,
		avatar: request.session.user.avatar,
		url,
		token: encryptedData,
		txt: friendSocket.i18n.t('pong.invitePlayer.inviteReceived', { username: request.session.user.username }),
	}));

	// Enregistrer le timestamp de cette invitation pour la limitation
	inviteThrottleMap.set(throttleKey, now);

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

	await modelPong.deleteTokenInvite(data.userId, data.friendId);

	friendSocket.send(JSON.stringify({
		action: 'MultiInviteRefuse',
		txt: friendSocket.i18n.t('pong.invitePlayer.refused', { username: user.username }),
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

	await modelPong.deleteTokenInvite(data.userId, data.friendId);

	const friendId = user.id === data.userId ? data.friendId : data.userId;
	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) return;
	friendSocket.send(JSON.stringify({
		action: 'MultiInviteCancel',
		txt: friendSocket.i18n.t('pong.invitePlayer.cancelled', { username: user.username }),
	}));
};

export default {
	getStatForPlayer,
	invitePlayer,
	confirmInvite,
	refuseInvite,
	cancelInvite
};