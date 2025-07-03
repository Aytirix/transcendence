import { User, Friends, Group } from '@types';
import executeReq from '@models/database';
import { userStatsPong } from '../WebSocket/pongGame/types/playerStat';
import { WebSocketServer, WebSocket } from 'ws';


async function getStatisticsForUser(userId: number): Promise<userStatsPong> {
	const query = `SELECT id, is_tournament, status FROM pong_stat WHERE user_id = ?`;
	const statUser: any = await executeReq(query, [userId]);

	let statUserData: any = {
		victoire: 0,
		defaite: 0,
		abandon: 0,
		tournamentVictory: 0,
	};

	return statUserData;
}

async function insertStatistic(userId: number, isTournament: number, status: number): Promise<boolean> {
	const query = `
		INSERT INTO pong_stat (user_id, is_tournament, status) 
		VALUES (?, ?, ?)
	`;
	const result: any = await executeReq(query, [userId, isTournament, status]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

export default {
	getStatisticsForUser,
	insertStatistic,
}