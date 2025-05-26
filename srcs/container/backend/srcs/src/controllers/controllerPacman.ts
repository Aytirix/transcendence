import { FastifyRequest, FastifyReply } from 'fastify';
import pacmanModel from '@models/modelPacman';
import tools from '@tools';
import { TileType } from "@Pacman/TypesPacman";
import Map from '@wsPacman/game/map/Map';

export const getAllMapForUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const maps = await pacmanModel.getAllMapsForUser(request.session.user.id);
	console.log('maps', tools.arrayToObject(maps));
	return reply.status(200).send({
		maps: tools.arrayToObject(maps),
	});
};

export const insertOrUpdateMap = async (request: FastifyRequest, reply: FastifyReply) => {
	const { id, name, map, is_public } = request.body as {
		id?: number;
		name: string;
		map: TileType[][];
		is_public: boolean;
	};

	if (id) {
		const existingMap = await pacmanModel.getMapForUserById(id, request.session.user.id);
		if (!existingMap || existingMap.length === 0) {
			return reply.status(404).send({
				message: request.i18n.t('errors.pacman.mapNotFound'),
			});
		}
	}

	const { is_valid, errors } = Map.validateMap(map);
	const infoMap = {
		id: id || null,
		user_id: request.session.user.id,
		name: name,
		map: map,
		is_public: is_public,
		is_valid: is_valid,
	}

	if (id && !(await pacmanModel.updateMap(infoMap))) {
		return reply.status(500).send({
			message: request.i18n.t('errors.pacman.updateMapError'),
		});
	}
	else if (!(await pacmanModel.insertMap(infoMap))) {
		return reply.status(500).send({
			message: request.i18n.t('errors.pacman.insertMapError'),
		});
	}

	return reply.status(200).send({
		id: infoMap.id,
		is_valid: is_valid,
		errors: errors,
	});
};

export const deleteMap = async (request: FastifyRequest, reply: FastifyReply) => {
	const { id } = request.body as { id: number };
	if (!id) {
		return reply.status(400).send({
			message: request.i18n.t('errors.pacman.mapIdRequired'),
		});
	}
	const existingMap = await pacmanModel.getMapForUserById(id, request.session.user.id);
	if (!existingMap || existingMap.length === 0) {
		return reply.status(404).send({
			message: request.i18n.t('errors.pacman.mapNotFound'),
		});
	}
	if (!(await pacmanModel.deleteMap(id))) {
		return reply.status(500).send({
			message: request.i18n.t('errors.pacman.deleteMapError'),
		});
	}
	return reply.status(200).send({
		message: request.i18n.t('success.pacman.mapDeleted'),
	});
};

export default {
	getAllMapForUser,
	insertOrUpdateMap,
};