import { FastifyInstance, FastifyReply, FastifyRequest, Session } from 'fastify';
import { sessionPayload, User } from '@types';
import { IncomingMessage } from 'http';
import { parse } from 'cookie';
import { decodeSessionId, getStore } from '@session';
import StateManager from '@wsPacman/game/StateManager';
import { getIngame } from './WebSocket/pongGame/state/serverState';


/**
 * Vérifie les informations de session dans la requête.
 * 
 * Cette fonction extrait le cookie de session de la requête, décode l'ID de session
 * et vérifie si le User-Agent actuel correspond à celui enregistré dans les informations de session.
 * 
 * @param request - La requête Fastify à vérifier
 * @param reply - La réponse Fastify pour pouvoir supprimer le cookie en cas d'invalidité
 * @returns `true` si les informations de session sont valides ou si aucune session n'est présente,
 *          `false` si la session est invalide, expirée ou si le User-Agent ne correspond pas
 */
async function checkSessionInfo(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {

	// Récupérer le cookie de session
	const cookies = request.headers.cookie || '';
	const sessionCookieName = 'sessionId';
	const sessionCookieRegex = new RegExp(`${sessionCookieName}=([^;]+)`);
	const match = cookies.match(sessionCookieRegex);

	if (match && match[1]) {
		const sessionId = match[1];
		const playload: sessionPayload = {
			userAgent: request.headers['user-agent'],
		};
		if (!await decodeSessionId(request, reply, playload, sessionId)) {
			return false;
		}
	}
	return true;
}

async function isNotAuthenticated(request: FastifyRequest, reply: FastifyReply) {
	if (request && request.session && request.session.user !== undefined && await checkSessionInfo(request, reply)) {
		return reply.status(403).send({
			message: request.i18n.t('login.alreadyLoggedIn'),
		});
	}
}

export async function isAuthenticated(request: FastifyRequest, reply: FastifyReply) {
	if (!request || !request.session || request.session.user === undefined || !await checkSessionInfo(request, reply)) {
		return reply.status(401).send({
			message: request.i18n.t('login.notLoggedIn'),
		});
	}
}

export async function isAuth(request: FastifyRequest, reply: FastifyReply) {
	if (request && request.session && request.session.user !== undefined && await checkSessionInfo(request, reply)) {
		const user = request.session.user as User;
		const GameInPacman = StateManager.RoomManager.PlayerInRoom(user.id);
		const pongInGame = getIngame(user.id);
		let redirect = null;
		if (GameInPacman) {
			redirect = '/Pacman';
		} else if (pongInGame.inGame) {
			redirect = pongInGame.nav;
		}
		return reply.status(200).send({
			isAuthenticated: true,
			redirect: redirect,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				lang: user.lang,
				avatar: user.avatar || null,
				twofa: user.twofa || null,
			},
		});
	} else {
		return reply.status(401).send({
			isAuthenticated: false,
			user: null,
		});
	}
}

export async function getSessionByCookie(request: IncomingMessage): Promise<Session | null> {
	try {
		const cookies = parse(request.headers.cookie || '');
		const rawSessionId = cookies['sessionId'];

		if (!rawSessionId) return null;
		const parts = rawSessionId.split('.');
		const sid = parts.length >= 3 ? `${parts[0]}.${parts[1]}` : parts[0];

		const store = await getStore();

		return new Promise((resolve, reject) => {
			store.get(sid, (err: any, session: Session) => {
				if (err) return reject(err);
				resolve(session);
			});
		});
	} catch (err) {
		console.error('Error fetching session:', err);
		return null;
	}
}

export default {
	isNotAuthenticated,
	isAuthenticated,
	isAuth,
	getSessionByCookie,
};