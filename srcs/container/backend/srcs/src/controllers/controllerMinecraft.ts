import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';

require('dotenv').config();


const DIRECTORY = path.join(__dirname, '..', '..', 'minecraft_data');

if (!fs.existsSync(DIRECTORY)) {
	fs.mkdirSync(DIRECTORY, { recursive: true });
}

export const getMinecraftUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const userId = request.session.user.id.toString();
	const filePath = path.join(DIRECTORY, `mc_${userId}.json`);

	let mc = { compressed: null };

	try {
		if (fs.existsSync(filePath)) {
			mc.compressed = fs.readFileSync(filePath, 'utf8');
		}
	} catch (error) {
		console.error(`Error reading minecraft data for user ${userId}:`, error);
	}

	return reply.send(mc);
}

export const setMinecraftUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const { compressed } = request.body as {
		compressed: string;
	};

	const userId = request.session.user.id.toString();
	const filePath = path.join(DIRECTORY, `mc_${userId}.json`);

	try {
		fs.writeFileSync(filePath, compressed, 'utf8');
	} catch (error) {
		console.error(`Error saving minecraft data for user ${userId}:`, error);
		return reply.code(500).send();
	}
	return reply.send();
}

export default {
	getMinecraftUser,
	setMinecraftUser
};