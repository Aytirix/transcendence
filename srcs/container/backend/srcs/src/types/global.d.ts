import fastify from 'fastify';
import { SessionData } from '@fastify/session';
import { User } from '@types';
import { WebSocket } from 'ws';

declare module 'fastify' {
	interface Session {
		user?: User;
	}
}

declare module 'fastify' {
	interface FastifyRequest {
		i18n: i18next.i18n;
		session: SessionData;
	}
}

declare module 'ws' {
	interface WebSocket {
		i18n?: any;
	}
}

declare module "*.html" {
	const content: string;
	export default content;
}