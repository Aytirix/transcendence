import { sockets, waitingMultiInvite } from "../state/serverState";
import { playerStat } from "../types/playerStat";
import { webMsg } from "../types/webMsg";
import { createGame } from "../game/initGame";
import { Game } from "../game/Game";
import modelUser from "../../../models/modelFriends";
import tools from "@tools";

export async function handleMultiInvite(playerInfos: playerStat, msg: webMsg) {
	if (!playerInfos) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (!msg.data) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	let decryptedData: any;
	try {
		decryptedData = tools.decrypt(msg.data);
		decryptedData = JSON.parse(decryptedData);
	} catch (error) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (Date.now() - new Date(decryptedData.datetime).getTime() > 40000) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (playerInfos.id !== decryptedData.userId && playerInfos.id !== decryptedData.friendId) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (!(await modelUser.checkIsFriend(decryptedData.userId, decryptedData.friendId))) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (checkInvitePlayer(decryptedData.friendId) === false) {
		playerInfos.socket.send(JSON.stringify({ type: "redirect", url: -1 }));
		return;
	}

	if (msg.action && msg.action === "Start") {
		playerInfos.isReady = true;
		console.log("Player is ready for multi invite:", playerInfos.id);
	}

	playerInfos.friendId = playerInfos.id === decryptedData.userId ? decryptedData.friendId : decryptedData.userId;

	playerInfos.mode = msg.type;

	if (waitingMultiInvite.size === 1 && waitingMultiInvite.has(playerInfos) === true) return;
	if (waitingMultiInvite.size >= 1) {
		for (const player2Infos of waitingMultiInvite) {
			if (player2Infos.id !== playerInfos.id && player2Infos.friendId === playerInfos.id) {
				if (player2Infos.isReady === true && playerInfos.isReady === true) {
					console.log("in game")
					waitingMultiInvite.delete(player2Infos);
					waitingMultiInvite.delete(playerInfos);
					playerInfos.inGame = true;
					player2Infos.inGame = true;
					const multiGame: Game = createGame(playerInfos, player2Infos);
					playerInfos.game = multiGame;
					player2Infos.game = multiGame;
					multiGame.start();
					return;
				}
			}
		}
	}
	if (waitingMultiInvite.has(playerInfos) === false) waitingMultiInvite.add(playerInfos);
	console.log("en attente d un second joueur ");
}

export function checkInvitePlayer(friendId: number): boolean {
	for (const [, playerInfos] of sockets) {
		if (playerInfos.id == friendId) {
			if (playerInfos.inGame == true) return false;
			break;
		}
	}
	return true;
}