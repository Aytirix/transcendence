import { FastifyInstance } from 'fastify';
import pacmanSchema from '@schemas/pacmanSchema';
import pacmanController from '@controllers/controllerPacman';
import Middleware from '@Middleware';

export default async (fastify: FastifyInstance) => {
	fastify.get('/pacman/statistics', {
		preHandler: [Middleware.isAuthenticated],
		schema: pacmanSchema.getStatisticsForUser,
	}, pacmanController.getStatisticsForUser);

	fastify.get('/pacman/statistics/:userId', {
		preHandler: [Middleware.isAuthenticated],
		schema: pacmanSchema.getStatisticsForSpecificUser,
	}, pacmanController.getStatisticsForSpecificUser);
};