import { User, Friends, Group } from '@types';
import executeReq from '@models/database';
import { userStatsPong } from '../WebSocket/pongGame/types/playerStat';
import { WebSocketServer, WebSocket } from 'ws';

setInterval(async () => {
	await checkTokenInvite();
}, 60000);

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
	getStatisticsForUser,
	insertStatistic,
	insertTokenInvite,
	getTokenInvite,
	deleteTokenInvite,
	checkUserIsInvited,
}