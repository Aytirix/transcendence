import { FastifyRequest, FastifyReply } from 'fastify';
import userModel from '@models/modelUser';

export const getElo = async (request: FastifyRequest, reply: FastifyReply) => {
	return reply.send({
		elo: 1000,
	});
};

export default {
	getElo,
};