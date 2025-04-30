import { WebSocket, RawData } from 'ws'
import { User } from '@types'
import { sockets, waitingID, waitingMulti } from '../state/serverState';

export function handleReconnection(socket: WebSocket, user: User) : boolean {
	if (waitingID.has(user.id)) {
			const tempPlayer = waitingID.get(user.id);
			sockets.delete(tempPlayer.socket);
			tempPlayer.socket = socket;
			tempPlayer.lastping = Date.now();
			sockets.set(socket, tempPlayer);
			waitingID.delete(user.id);
			tempPlayer.game.getPlayer1().getPlayerInfos().socket = socket;
			tempPlayer.game.setStatus("PLAYING");
			return (true);
	}
	// else if (waitingMulti.has(user.id)) {
	// 	return (true);
	// }
	return (false);
}