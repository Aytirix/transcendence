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
	
	let userData = {
		_eaglercraftX_g: '',
		_eaglercraftX_p: '',
		_eaglercraftX_r: '',
		lastMinecraftAccess: 0,
		resourcePacks: [],
		worlds: []
	};

	try {
		if (fs.existsSync(filePath)) {
			const fileData = fs.readFileSync(filePath, 'utf8');
			userData = JSON.parse(fileData);
		}
	} catch (error) {
		console.error(`Error reading minecraft data for user ${userId}:`, error);
	}

	return reply.send(userData);
}

export const setMinecraftUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const { _eaglercraftX_g, _eaglercraftX_p, _eaglercraftX_r, lastMinecraftAccess, resourcePacks, worlds } = request.body as {
		_eaglercraftX_g: string;
		_eaglercraftX_p: string;
		_eaglercraftX_r: string;
		lastMinecraftAccess: number;
		resourcePacks?: any[];
		worlds?: any[];
	};
	
	const userId = request.session.user.id.toString();
	const filePath = path.join(DIRECTORY, `mc_${userId}.json`);
	
	const minecraftData = {
		_eaglercraftX_g,
		_eaglercraftX_p,
		_eaglercraftX_r,
		lastMinecraftAccess,
		resourcePacks: resourcePacks || [],
		worlds: worlds || []
	};

	try {
		fs.writeFileSync(filePath, JSON.stringify(minecraftData, null, 2), 'utf8');
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