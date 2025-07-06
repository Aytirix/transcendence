import { User, Friends, Group } from '@types';
import executeReq from '@models/database';
import { userStatsPong } from '../WebSocket/pongGame/types/playerStat';
import { WebSocketServer, WebSocket } from 'ws';
import { MatchSummary } from '../WebSocket/pongGame/types/playerStat';

setInterval(async () => {
	await checkTokenInvite();
}, 60000);

async function getStatisticsForUser(userId: number): Promise<any[]> {
		const query = `
			SELECT 
				pong_stat.id,
				pong_stat.is_tournament,
				pong_stat.status,
				pong_stat.match_date,
				pong_stat.game_mode,
				pong_stat.opponent_id,
				users.username AS opponent_name
			FROM pong_stat
			LEFT JOIN users ON pong_stat.opponent_id = users.id
			WHERE pong_stat.user_id = ?
			ORDER BY pong_stat.match_date DESC
		`;
		const statUser: any = await executeReq(query, [userId]);
		
		console.log("statUser", statUser)


	return statUser;
}



async function insertStatistic(userId: number, isTournament: number, status: number, gameMode: string, opponentId: number): Promise<boolean> {
	const query = `
		INSERT INTO pong_stat (user_id, is_tournament, status, match_date, game_mode, opponent_id) 
		VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
	`;
	const result: any = await executeReq(query, [userId, isTournament, status, gameMode, opponentId]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

async function deleteStatistic(userId: number): Promise<boolean> {
	const query = `
		DELETE FROM pong_stat WHERE user_id = ? AND is_tournament = 0 AND status = 1 LIMIT 1
	`;
	const result: any = await executeReq(query, [userId]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

async function insertTokenInvite(userId: number, friendId: number, token: string, createdAt: number): Promise<boolean> {
	const query = `
		INSERT OR REPLACE INTO pong_invite (user_id, friend_id, token, created_at)
		VALUES (?, ?, ?, ?)
	`;
	const result: any = await executeReq(query, [userId, friendId, token, createdAt]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

async function checkTokenInvite(): Promise<void> {
	const query = `
		SELECT created_at
		FROM pong_invite
	`;
	const result: any = await executeReq(query);
	if (!result || result.length === 0) {
		return;
	}

	const currentTime = Date.now();
	for (const invite of result) {
		// Check if the invite is older than 5 minutes
		if (currentTime - invite.created_at > 5 * 60 * 1000) {
			await deleteTokenInvite(invite.user_id, invite.friend_id);
		}
	}
}

async function getTokenInvite(userId: number, friendId: number): Promise<{ token: string, createdAt: number } | null> {
	const query = `
		SELECT token, created_at
		FROM pong_invite
		WHERE user_id = ? AND friend_id = ? OR user_id = ? AND friend_id = ?
	`;
	const result: any = await executeReq(query, [userId, friendId, friendId, userId]);
	if (!result || result.length === 0) {
		return null;
	}

	const currentTime = Date.now();
	if (currentTime - result[0].created_at > 5 * 60 * 1000) {
		await deleteTokenInvite(userId, friendId);
		return null;
	}

	return {
		token: result[0].token,
		createdAt: result[0].created_at,
	};
}

async function deleteTokenInvite(userId: number, friendId: number): Promise<boolean> {
	const query = `
		DELETE FROM pong_invite
		WHERE user_id = ? AND friend_id = ? OR user_id = ? AND friend_id = ?
	`;
	const result: any = await executeReq(query, [userId, friendId, friendId, userId]);
	if (!result || result.affectedRows === 0) {
		return false;
	}
	return true;
}

async function checkUserIsInvited(friendId: number, userId?: number): Promise<{ userId: number, friendId: number, token: string, createdAt: number } | null> {
	let query = `
		SELECT user_id, friend_id, token, created_at
		FROM pong_invite
		WHERE (user_id = ? OR friend_id = ?)
	`;
	let params = [friendId, friendId];
	if (userId) {
		query += `  AND (friend_id != ? AND user_id != ?)`;
		params.push(userId, userId);
	}
	const result: any = await executeReq(query, params);
	if (!result || result.length === 0) {
		return null;
	}

	const currentTime = Date.now();
	if (currentTime - result[0].created_at > 5 * 60 * 1000) {
		await deleteTokenInvite(friendId, userId);
		return null;
	}

	return {
		userId: result[0].user_id,
		friendId: result[0].friend_id,
		token: result[0].token,
		createdAt: result[0].created_at,
	};
}

export default {
	deleteStatistic,
	getStatisticsForUser,
	insertStatistic,
	insertTokenInvite,
	getTokenInvite,
	deleteTokenInvite,
	checkUserIsInvited,
}