// wsServer.js
import { WebSocket } from 'ws';
import { GameSolo } from "@models/modelQueens";
import { User } from '@types';

function wsQueenSolo(ws, user: User) {
	const game = new GameSolo(user.id);
	ws.on("message", async (message) => {
		try {
			const data = JSON.parse(message);
			let result = null;
			switch (data.action) {
				case 'ping':
					result = { result: 'ok', message: 'pong' };
					break;
				case 'new_game':
					result = await game.newGame();
					break;
				case 'make_move':
					result = await game.makeMove(data.row, data.col, data.newState);
					break;
				case 'undo':
					result = await game.undo();
					break
				case 'hint':
					result = await game.hint();
					break;
				case 'solution':
					result = await game.solution();
					break;
				case 'update_parameters':
					result = await game.updateParameters(data);
					break
				case 'get_game':
					result = await game.getGame();
					break
				default:
					result = { status: 'error', message: 'Action invalide' };
					break;
			}

			ws.send(JSON.stringify(result));
		} catch (err) {
			console.error(err);
			ws.send(JSON.stringify({ status: 'error', message: 'Erreur interne' }));
		}
	});
}

export { wsQueenSolo };