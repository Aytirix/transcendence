import { parse } from 'cookie';
import SQLiteStoreFactory from 'connect-sqlite3';
import { Socket } from 'net';
import { IncomingMessage } from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import { FastifyInstance, Session } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import Middleware from '@Middleware';
import chatWebSocket from './chat/wsChat';
import { User } from '@types';
import { pongWebSocket } from './pongGame/pongSocketHandler';
import { PacManWebSocket } from './Pacman/PacManWebSocket';
import { createi18nObject } from '../hook';

let wss: WebSocketServer | null = null;
let userConnected: Map<string, WebSocket> = new Map<string, WebSocket>();

async function initWebSocket(server: FastifyInstance) {
	if (wss) return;

	wss = new WebSocketServer({ noServer: true, perMessageDeflate: false, clientTracking: true });

	wss.on('connection', (ws: WebSocket, session: Session, request: IncomingMessage) => {
		const path = request.url;
		ws.i18n = createi18nObject(session, request.headers);

		switch (path) {
			case '/chat':
				chatWebSocket(ws, session.user);
				break;
			case '/pong':
				pongWebSocket(ws, session.user);
				break;
			case '/Pacman':
				PacManWebSocket(ws, session.user);
				break;
			default:
				ws.close(1008, JSON.stringify({ action: 'error', result: 'error', notification: ['Erreur : chemin WebSocket non reconnu.'] }));
				break;
		}

		ws.on('close', () => {
			const userKey = `${path}_${session.user.id}`;
			if (userConnected.has(userKey)) userConnected.delete(userKey);
			else console.warn(`User not found in connected users list: ${session.user.id}`);
		});

		ws.on('error', (error: Error) => {
			const userKey = `${path}_${session.user.id}`;
			if (userConnected.has(userKey)) userConnected.delete(userKey);
			else console.warn(`User not found in connected users list: ${session.user.id}`);
		});
	});


	server.server.on('upgrade', async (request: IncomingMessage, socket: Socket, head: Buffer) => {
		try {
			const session = await Middleware.getSessionByCookie(request);
			if (!session || !session.user) {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				socket.destroy();
				return;
			}

			const userKey = `${request.url}_${session.user.id}`;
			const existingSocket = userConnected.get(userKey);
			if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
				console.warn(`User already connected: ${session.user.id}`);
				socket.write('HTTP/1.1 409 Conflict\r\n\r\n');
				socket.destroy();
				return;
			} else if (existingSocket) {
				userConnected.delete(userKey);
			}

			wss?.handleUpgrade(request, socket, head, (ws: WebSocket) => {
				userConnected.set(userKey, ws);
				wss?.emit('connection', ws, session, request);
			});
		} catch (err) {
			console.error('Erreur lors de la gestion de la connexion WebSocket:', err);
			socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
			socket.destroy();
		}
	});
}

export { initWebSocket };
