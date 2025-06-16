import { User, Friends, Group } from '@types';
import executeReq from '@models/database';
import { map } from '@Pacman/TypesPacman';
import { WebSocketServer, WebSocket } from 'ws';

async function getAllMapsForUser(userId: number): Promise<map[]> {
	const query = `SELECT * FROM pacman_map WHERE user_id = ? ORDER BY updated_at DESC`;
	const result: any = await executeReq(query, [userId]);
	if (!result || result.length === 0) {
		return [];
	}
	const maps: map[] = result.map((row: any) => ({
		id: row.id,
		user_id: row.user_id,
		name: row.name,
		map: JSON.parse(row.map),
		is_public: row.is_public === 1,
		is_valid: row.is_valid === 1,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	}));
	return maps;
}

async function getMapForUserByName(id: number, name: string): Promise<map[]> {
	const query = `SELECT * FROM pacman_map WHERE user_id = ? AND name = ?`;
	const result: any = await executeReq(query, [id, name]);
	if (!result || result.length === 0) {
		return [];
	}
	const maps: map[] = result.map((row: any) => ({
		id: row.id,
		user_id: row.user_id,
		name: row.name,
		map: JSON.parse(row.map),
		is_public: row.is_public === 1,
		is_valid: row.is_valid === 1,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	}));
	return maps;
}

async function getMapForUserById(id: number, userId: number): Promise<map[]> {
	const query = `SELECT * FROM pacman_map WHERE id = ? AND user_id = ?`;
	const result: any = await executeReq(query, [id, userId]);
	if (!result || result.length === 0) {
		return [];
	}
	const maps: map[] = result.map((row: any) => ({
		id: row.id,
		user_id: row.user_id,
		name: row.name,
		map: JSON.parse(row.map),
		is_public: row.is_public === 1,
		is_valid: row.is_valid === 1,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	}));
	return maps;
}

async function getMapById(id: number): Promise<map | null> {
	const query = `SELECT * FROM pacman_map WHERE id = ?`;
	const result: any = await executeReq(query, [id]);
	if (!result || result.length === 0) {
		return null;
	}
	const row = result[0];
	return {
		id: row.id,
		user_id: row.user_id,
		name: row.name,
		map: JSON.parse(row.map),
		is_public: row.is_public === 1,
		is_valid: row.is_valid === 1,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	};
}

async function insertMap(map: map): Promise<boolean> {
	const query = `
        INSERT INTO pacman_map (user_id, name, map, is_public, is_valid) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        map = VALUES(map), 
        is_public = VALUES(is_public), 
        is_valid = VALUES(is_valid),
        updated_at = NOW()
    `;

	const result: any = await executeReq(query, [
		map.user_id,
		map.name,
		JSON.stringify(map.map),
		map.is_public ? 1 : 0,
		map.is_valid ? 1 : 0,
	]);

	if (!result || (result.affectedRows === 0 && result.changedRows === 0)) {
		return false;
	}
	map.id = result.insertId || map.id;
	return true;
}

async function updateMap(map: map): Promise<boolean> {
	const query = `
		UPDATE pacman_map 
		SET name = ?, 
			map = ?, 
			is_public = ?, 
			is_valid = ?,
			updated_at = NOW()
		WHERE id = ?
	`;

	const result: any = await executeReq(query, [
		map.name,
		JSON.stringify(map.map),
		map.is_public ? 1 : 0,
		map.is_valid ? 1 : 0,
		map.id,
	]);

	if (!result || (result.affectedRows === 0 && result.changedRows === 0)) {
		return false;
	}
	return true;
}

async function deleteMap(id: number): Promise<boolean> {
	const query = `DELETE FROM pacman_map WHERE id = ?`;
	const result: any = await executeReq(query, [id]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

async function searchMap(player_id: number, query: string): Promise<map[]> {
	const searchQuery = `%${query}%`;
	const sql = 'SELECT * FROM `pacman_map` as `pm` WHERE `pm`.`name` LIKE ? AND `pm`.`is_valid` = 1 AND (`pm`.`is_public` = 1  OR `pm`.`user_id` = ?) ORDER BY `pm`.`updated_at` DESC';
	const result: any = await executeReq(sql, [searchQuery, player_id]);
	if (!result || result.length === 0) {
		return [];
	}
	const maps: map[] = result.map((row: any) => ({
		id: row.id,
		user_id: row.user_id,
		name: row.name,
		map: JSON.parse(row.map) as map[][],
		is_public: row.is_public === 1,
		is_valid: row.is_valid === 1,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	}));
	return maps;
}

export default {
	getAllMapsForUser,
	getMapForUserByName,
	getMapForUserById,
	getMapById,
	insertMap,
	updateMap,
	deleteMap,
	searchMap,
}