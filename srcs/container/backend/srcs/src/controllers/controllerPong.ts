import { FastifyRequest, FastifyReply } from 'fastify';
import modelFriend from '@models/modelFriends';
import tools from '@tools';
import { randomBytes } from 'crypto';
import { checkInvitePlayer } from '../WebSocket/pongGame/handlers/handleMultiInvite';
import modelUser from '@models/modelUser';
import { getSocketByUserId } from '../WebSocket/chat/wsChat';

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
			message: request.i18n.t('pong.invitePlayer.alreadyInGame', { username: friendId }),
		});
	}

	const friendSocket = getSocketByUserId(friendId);
	if (!friendSocket) {
		return reply.status(403).send({
			message: request.i18n.t('pong.invitePlayer.notOnline', { friendId }),
		});
	}

	const jsonPlayers = {
		userId: request.session.user.id,
		friendId: friendId,
		randomBytes: randomBytes(32).toString('hex'),
		datetime: new Date().toISOString(),
		
	};
	const encryptedData = tools.encrypt(JSON.stringify(jsonPlayers));
	console.log('encodeURIComponent : ', encodeURIComponent(encryptedData));
	const url = '/pong/menu/MultiPlayersInvite?data=' + encodeURIComponent(encryptedData);
	friendSocket.send(JSON.stringify({
		action: 'MultiInvite',
		username: request.session.user.username,
		avatar: request.session.user.avatar,
		url
	}));

	return reply.send({
		redirect: url
	});
};

export default {
	invitePlayer,
};