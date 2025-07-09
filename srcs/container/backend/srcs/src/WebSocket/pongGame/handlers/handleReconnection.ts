import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { sockets, waitingID, waitingMulti } from '../state/serverState';
import { playerStat } from '../types/playerStat';

export function handleReconnection(socket: WebSocket, user: User) : boolean {
	if (waitingID.has(user.id)) {
			const tempPlayer = waitingID.get(user.id);
			if (tempPlayer.inGame === false) {
				waitingID.delete(user.id);
			}
			else if (tempPlayer.mode === "SameKeyboard") {
				sockets.delete(tempPlayer.socket);
				tempPlayer.socket = socket;
				tempPlayer.lastping = Date.now();
				sockets.set(socket, tempPlayer);
				waitingID.delete(user.id);
				tempPlayer.socket.send(JSON.stringify({type: "SameKeyboard"}));
				tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
				tempPlayer.game.setStatus("KICKOFF");
				return (true);
			}
			else if (tempPlayer.mode === "Solo") {
				sockets.delete(tempPlayer.socket);
				tempPlayer.socket = socket;
				tempPlayer.lastping = Date.now();
				sockets.set(socket, tempPlayer);
				waitingID.delete(user.id);
				tempPlayer.socket.send(JSON.stringify({type: "Solo"}));
				tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
				tempPlayer.game.setStatus("KICKOFF");
				return (true);
			}
			else if (tempPlayer.mode === "Multi") {
				const user1 = tempPlayer.game.getPlayer1().getPlayerInfos().id;
				sockets.delete(tempPlayer.socket)
				tempPlayer.socket = socket;
				tempPlayer.lastping = Date.now();
				sockets.set(socket, tempPlayer);
				waitingID.delete(user.id);
				if (user1 === user.id) {
					tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
					tempPlayer.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p1" }))
				}
				else {
					tempPlayer.game.getPlayer2().getPlayerInfos().socket = socket;
					tempPlayer.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p2" }))
				}

				tempPlayer.game.setStatus("KICKOFF");
				return (true);
			}
			else if (tempPlayer.mode === "MultiInvite") {
				const user1 = tempPlayer.game.getPlayer1().getPlayerInfos().id;
				sockets.delete(tempPlayer.socket)
				tempPlayer.socket = socket;
				tempPlayer.lastping = Date.now();
				sockets.set(socket, tempPlayer);
				waitingID.delete(user.id);
				if (user1 === user.id) {
					tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
					tempPlayer.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p1" }))
				}
				else {
					tempPlayer.game.getPlayer2().getPlayerInfos().socket = socket;
					tempPlayer.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p2" }))
				}

				tempPlayer.game.setStatus("KICKOFF");
				return (true);
			}
			else if (tempPlayer.mode === "Tournament") {
				let user1: number;
				if (tempPlayer.game)
					user1 = tempPlayer.game.getPlayer1().getPlayerInfos().id;
				sockets.delete(tempPlayer.socket);
				tempPlayer.socket = socket;
				tempPlayer.lastping = Date.now();
				sockets.set(socket, tempPlayer);
				waitingID.delete(user.id);
				if (user1) {
					if (user1 === user.id) {
						tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
						tempPlayer.game.getPlayer1().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p1" }))
					}
					else {
						tempPlayer.game.getPlayer2().getPlayerInfos().socket = socket;
						tempPlayer.game.getPlayer2().getPlayerInfos().socket.send(JSON.stringify({ type: "assign", value: "p2" }))
					}
					tempPlayer.game.setStatus("KICKOFF"); //KICKOFF
				}
				return (true);
			}
		}
			socket.send(JSON.stringify({type: "Remove"}));
	return (false);
}