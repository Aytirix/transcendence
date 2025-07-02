import { User, Friends, Group } from '@types';
import executeReq from '@models/database';
import { map, userStatsPacman } from '@Pacman/TypesPacman';
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
		ON CONFLICT(user_id, name) DO UPDATE SET 
        name = excluded.name, 
        map = excluded.map, 
        is_public = excluded.is_public, 
        is_valid = excluded.is_valid,
        updated_at = datetime('now')
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
			updated_at = datetime('now')
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

async function getStatisticsForUser(userId: number): Promise<userStatsPacman> {
	const query = `SELECT id, type, score, death_count, win FROM pacman_stat WHERE user_id = ?`;
	const statUser: any = await executeReq(query, [userId]);

	// Séparer les stats par type
	const pacmanStats = statUser.filter((row: any) => row.type === 'pacman');
	const ghostStats = statUser.filter((row: any) => row.type === 'ghost');

	// Calculer les statistiques agrégées pour Pacman
	const pacmanGamesPlayed = pacmanStats.length;
	const pacmanGamesWon = pacmanStats.filter((row: any) => row.win === 1).length;
	const pacmanGamesLost = pacmanGamesPlayed - pacmanGamesWon;
	const pacmanWinRate = pacmanGamesPlayed > 0 ? Math.round((pacmanGamesWon / pacmanGamesPlayed) * 100 * 100) / 100 : 0;
	const pacmanBestScore = pacmanStats.length > 0 ? Math.max(...pacmanStats.map((row: any) => row.score)) : 0;
	const pacmanAverageScore = pacmanStats.length > 0 ? Math.round((pacmanStats.reduce((sum: number, row: any) => sum + row.score, 0) / pacmanStats.length) * 100) / 100 : 0;

	// Calculer les statistiques agrégées pour Ghost
	const ghostGamesPlayed = ghostStats.length;
	const ghostGamesWon = ghostStats.filter((row: any) => row.win === 1).length;
	const ghostGamesLost = ghostGamesPlayed - ghostGamesWon;
	const ghostWinRate = ghostGamesPlayed > 0 ? Math.round((ghostGamesWon / ghostGamesPlayed) * 100 * 100) / 100 : 0;
	const ghostBestScore = ghostStats.length > 0 ? Math.max(...ghostStats.map((row: any) => row.score)) : 0;
	const ghostAverageScore = ghostStats.length > 0 ? Math.round((ghostStats.reduce((sum: number, row: any) => sum + row.score, 0) / ghostStats.length) * 100) / 100 : 0;

	// Top 3 joueurs pacman
	const queryPacmanRecords = `
        SELECT ps.id, ps.score, u.username
        FROM pacman_stat ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.win = 1 AND ps.type = 'pacman'
        ORDER BY ps.score DESC
        LIMIT 3
    `;
	const recordPacman: any = await executeReq(queryPacmanRecords);

	// Top 3 joueurs ghost  
	const queryGhostRecords = `
        SELECT ps.id, ps.score, u.username
        FROM pacman_stat ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.win = 1 AND ps.type = 'ghost'
        ORDER BY ps.score DESC
        LIMIT 3
    `;
	const recordGhost: any = await executeReq(queryGhostRecords);

	return {
		pacman: {
			games_played: pacmanGamesPlayed,
			games_won: pacmanGamesWon,
			games_lost: pacmanGamesLost,
			win_rate: pacmanWinRate,
			best_score: pacmanBestScore,
			average_score: pacmanAverageScore,
		},
		ghosts: {
			games_played: ghostGamesPlayed,
			games_won: ghostGamesWon,
			games_lost: ghostGamesLost,
			win_rate: ghostWinRate,
			best_score: ghostBestScore,
			average_score: ghostAverageScore,
		},
		record_pacman: recordPacman.map((row: any) => ({
			id: row.id,
			username: row.username,
			score: row.score,
		})),
		record_ghost: recordGhost.map((row: any) => ({
			id: row.id,
			username: row.username,
			score: row.score,
		})),
	};
}

async function insertStatistic(userId: number, type: string, score: number, deathCount: number, win: boolean): Promise<boolean> {
	const query = `
		INSERT INTO pacman_stat (user_id, type, score, death_count, win) 
		VALUES (?, ?, ?, ?, ?)
	`;
	type = type.toLowerCase();
	const result: any = await executeReq(query, [userId, type, score, deathCount, win ? 1 : 0]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
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
	getStatisticsForUser,
	insertStatistic,
}