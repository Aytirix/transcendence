import { FastifyInstance } from 'fastify';
import userController from '@controllers/controllerUser';
import userSchema from '@schemas/userSchema';
import Middleware from '@Middleware';

import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import multipart from "@fastify/multipart";

const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR);

const MAX_SIZE = 3 * 1024 * 1024;

export default async (fastify: FastifyInstance) => {

	fastify.register(multipart, {
		limits: {
			fileSize: MAX_SIZE,
			files: 1,
			fieldSize: MAX_SIZE
		}
	});

	fastify.register(fastifyStatic, {
		root: AVATAR_DIR,
		prefix: '/avatars/',
		setHeaders: (res, path) => {
			res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
		}
	});

	fastify.post('/upload-avatar', {
		preHandler: [Middleware.isAuthenticated],
		schema: userSchema.UploadAvatar,
		handler: userController.UploadAvatar
	});
};