import { FastifyInstance } from 'fastify';
import controllerMinecraft from '@controllers/controllerMinecraft';
import minecraftSchema from '@schemas/minecraftSchema';
import Middleware from '@Middleware';

export default async (fastify: FastifyInstance) => {
	fastify.get('/getMinecraftUser', {
		preHandler: [Middleware.isAuthenticated],
		schema: minecraftSchema.getMinecraftUser,
		handler: controllerMinecraft.getMinecraftUser,
	});

	fastify.post('/setMinecraftUser', {
		preHandler: [Middleware.isAuthenticated],
		schema: minecraftSchema.setMinecraftUser,
		bodyLimit: 10 * 1024 * 1024, // 10 Mo
		handler: controllerMinecraft.setMinecraftUser,
	});
};	