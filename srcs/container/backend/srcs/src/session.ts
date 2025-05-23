import { FastifyInstance, FastifyRequest, Session } from 'fastify';
import fastifySession, { FastifySessionOptions } from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { encrypt, decrypt } from '@tools';
import { sessionPayload } from '@types';

dotenv.config();

let store: CustomSQLiteStore = null;

class CustomSQLiteStore {
	private db: sqlite3.Database;

	constructor() {
		this.db = new sqlite3.Database('./sqlite/sessions.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
		this.initTable();
	}

	private initTable() {
		const createTableSQL = `
			CREATE TABLE IF NOT EXISTS sessions (
				sid TEXT PRIMARY KEY,
				expired INTEGER,
				sess TEXT,
				user_id INTEGER UNIQUE
			);
		`;

		this.db.run(createTableSQL, (err) => {
			if (err) {
				console.error('Error creating sessions table:', err);
			}
		});
	}

	set(sid: string, session: Session, callback: (err?: Error) => void) {
		const userId = session.user?.id || null;
		if (!userId) return callback(null);
		const sess = JSON.stringify(session);
		const expiration = session.cookie?.expires ? new Date(session.cookie.expires).getTime() : null;

		this.db.run(
			`INSERT OR REPLACE INTO sessions (sid, expired, sess, user_id) VALUES (?, ?, ?, ?)`,
			[sid, expiration, sess, userId],
			(err) => {
				callback(err);
			}
		);
	}

	get(sid: string, callback: (err: any, session?: Session) => void) {
		this.db.get(
			`SELECT sess FROM sessions WHERE sid = ?`,
			[sid],
			(err, row: { sess: string } | undefined) => {
				if (err) return callback(err);
				if (!row) return callback(null);

				try {
					const session = JSON.parse(row.sess);
					callback(null, session);
				} catch (e) {
					callback(e);
				}
			}
		);
	}

	destroy(sid: string, callback: (err: any) => void) {
		this.db.run(
			`DELETE FROM sessions WHERE sid = ?`,
			[sid],
			(err) => {
				callback(err);
			}
		);
	}
}

export async function getStore() {
	if (!store) store = new CustomSQLiteStore();
	return store;
}

/**
 * Crée un ID de session personnalisé contenant des informations encodées de l'utilisateur
 * @param userInfo Informations utilisateur à encoder dans l'ID de session
 * @returns Un ID de session sécurisé contenant les informations encodées
 */
export function createSessionId(userInfo: Record<string, any> = {}): string {
	// Encodage des informations utilisateur en Base64
	const randomValue = crypto.randomBytes(16).toString('hex');

	const payload = Buffer.from(encrypt(JSON.stringify(userInfo))).toString('base64url');

	// Création d'une signature simple avec HMAC
	const signature = crypto
		.createHmac('sha256', process.env.SESSION_SECRET)
		.update(`${payload}.${randomValue}`)
		.digest('base64url');

	// Format: payload.timestamp.randomValue.signature
	return `${signature}.${randomValue}`;
}

/**
 * Décode un ID de session pour extraire les informations utilisateur
 * @param sessionId L'ID de session à décoder
 * @returns Les informations utilisateur décodées ou null si invalide
 */
export function decodeSessionId(playload: sessionPayload, sessionId: string): boolean {
	try {
		const [signature, randomValue] = sessionId.split('.');

		const payload = Buffer.from(encrypt(JSON.stringify(playload))).toString('base64url');

		// Vérification de la signature
		const expectedSignature = crypto
			.createHmac('sha256', process.env.SESSION_SECRET)
			.update(`${payload}.${randomValue}`)
			.digest('base64url');

		if (signature !== expectedSignature) {
			console.warn('Signature invalide pour l\'ID de session');
			return null;
		}

		return true;
	} catch (error) {
		console.error('Erreur lors du décodage de l\'ID de session:', error);
		return false;
	}
}

export async function registerSession(app: FastifyInstance) {

	app.register(fastifyCookie);

	// Définir les options avec le type correct
	const sessionOptions: FastifySessionOptions = {
		secret: process.env.SESSION_SECRET,
		cookie: {
			secure: true,
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
			httpOnly: true,
			sameSite: 'none',
			path: '/',
		},
		idGenerator: (req: FastifyRequest) => {
			const initialUserInfo: sessionPayload = {
				userAgent: req.headers['user-agent'],
			};
			return createSessionId(initialUserInfo);
		},
		store: await getStore(),
	};

	app.register(fastifySession, sessionOptions);
}

export default {
	getStore,
	registerSession,
}
