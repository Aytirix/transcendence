import { FastifyInstance } from 'fastify';
import userController from '@controllers/controllerUser';
import controllerPong from '@controllers/controllerPong';
import pongSchema from '@schemas/pongSchema';
import Middleware from '@Middleware';

export default async (fastify: FastifyInstance) => {
	fastify.post('/pong/invitePlayer', {
		preHandler: Middleware.isAuthenticated,
		schema: pongSchema.invitePlayer,
		handler: controllerPong.invitePlayer,
	});
};