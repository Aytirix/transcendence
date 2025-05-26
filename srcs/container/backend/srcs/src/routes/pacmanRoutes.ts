import { FastifyInstance } from 'fastify';
import pacmanSchema from '@schemas/pacmanSchema';
import pacmanController from '@controllers/controllerPacman';

export default async (fastify: FastifyInstance) => {
	fastify.get('/pacman/getMapForUser', {
		schema: pacmanSchema.getMap,
		handler: pacmanController.getAllMapForUser,
	});

	fastify.post('/pacman/insertOrUpdateMap', {
		schema: pacmanSchema.insertOrUpdateMap,
		handler: pacmanController.insertOrUpdateMap,
	});


};