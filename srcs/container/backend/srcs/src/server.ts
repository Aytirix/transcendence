/// <reference path="./types/global.d.ts" />

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import { registerHook } from './hook';
import { registerSession } from './session';
import { setupSwagger } from './docs';
import { initWebSocket } from './WebSocket/wsInit';
import userRoutes from './routes/userRoutes';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import dotenv from 'dotenv';
import pacmanRoutes from './routes/pacmanRoutes';
import fileRoutes from './routes/fileRoutes';
import minecraftRoutes from './routes/minecraftRoutes';
import pongRoutes from './routes/pongRoutes';

dotenv.config();

const app = fastify({ trustProxy: true, bodyLimit: 5242880 }); // 5MB

(async () => { await setupSwagger(app); })();

const ajv = new Ajv({
	allErrors: true,
	useDefaults: true,
	strict: false,
});

addFormats(ajv);
ajvErrors(ajv);
app.setValidatorCompiler(({ schema }) => { return ajv.compile(schema); });
(async () => {
	await registerSession(app);
})();
app.register(fastifyRateLimit, {
	max: 500,
	timeWindow: '10 minute',
	errorResponseBuilder: (req, context) => {
		return {
			statusCode: 429,
			error: 'Too Many Requests',
			message: `Trop de requêtes. Veuillez réessayer dans ${Math.ceil(context.ttl / 1000)} secondes.`,
		};
	}
});
registerHook(app);
app.register(fastifyHelmet, {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			imgSrc: ["'self'", "https:", "data:"],
			scriptSrc: ["'self'"],
			upgradeInsecureRequests: [],
			styleSrc: ["'self'", "https:"],
			objectSrc: ["'none'"],
		}
	}
});

app.register(fastifyCors, {
	origin: (origin, cb) => cb(null, true),
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	credentials: true,
	preflightContinue: false,
	optionsSuccessStatus: 204,
});

// Enregistrement des routes
app.register(userRoutes);
app.register(pacmanRoutes);
app.register(fileRoutes);
app.register(minecraftRoutes);
app.register(pongRoutes);

// Intégration de WebSocket
initWebSocket(app);  // Appel de la fonction initWebSocket

app.get('*', (req, res) => {
	console.error(`404 Not Found: ${req.raw.url}`);
	res.status(404).send('{ "success": false, "message": "The endpoint you are looking for might have been removed, had its name changed, or is temporarily unavailable." }');
});

try {
	app.listen({ port: 7000, host: '0.0.0.0' }, (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.clear();
		console.log(`Server listening at ${address}`);
	});
} catch (err) {
	console.error('Error starting server:', err);
	process.exit(1);
}