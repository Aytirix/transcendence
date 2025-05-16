import { FastifyInstance } from 'fastify';
import pacmanSchema from '@schemas/pacmanSchema';
import pacmanController from '@controllers/controllerPacman';
import Middleware from '@Middleware';

export default async (fastify: FastifyInstance) => {
	fastify.get('/pacman/getElo', {
		schema: pacmanSchema.getElo,
		handler: pacmanController.getElo,
	});

};