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

	fastify.get('/pong/getStatistics', {
		preHandler: Middleware.isAuthenticated,
		schema: pongSchema.getStatistics,
		handler: controllerPong.getStatForPlayer,
	});

	fastify.get('/pong/statistics/:userId', {
		preHandler: Middleware.isAuthenticated,
		schema: pongSchema.getStatisticsForUser,
		handler: controllerPong.getStatForUser,
	});
};