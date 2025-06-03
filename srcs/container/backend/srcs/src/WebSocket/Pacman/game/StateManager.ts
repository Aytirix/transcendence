import { player, room, GameState } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws'
import Engine from "./Engine";
import defaultMap from "./map/default_map";

class RoomManager {
	private static instance: RoomManager;
	private rooms: Map<number, room> = new Map();
	private constructor() { }

	static getInstance(): RoomManager {
		if (!RoomManager.instance) {
			RoomManager.instance = new RoomManager();
		}
		return RoomManager.instance;
	}

	public createRoom(player: player, name: string): room {
		if (this.PlayerInRoom(player.id)) return;
		console.log(`map: ${JSON.stringify(defaultMap)}`);
		const room: room = {
			id: Date.now() + Math.floor(Math.random() * 1000),
			name: name,
			owner_id: player.id,
			owner_username: player.username,
			settings: {
				map: JSON.parse(JSON.stringify(defaultMap))
			},
			players: [player],
			state: 'waiting',
		};
		this.rooms.set(room.id, room);
		return room;
	}

	public joinRoom(player: player, roomId: number): boolean {
		if (this.PlayerInRoom(player.id)) return false;
		const game = this.getRoom(roomId);
		if (game && game.players.length < 5) {
			game.players.push(player);
			this.rooms.set(roomId, game);
			return true;
		}
		return false;
	}

	public PlayerInRoom(playerId: number): boolean {
		for (const game of this.rooms.values()) {
			if (game.players.some(p => p.id === playerId)) {
				return true;
			}
		}
		return false;
	}

	public updatePlayerInRoom(room: room, player: player): void {
		if (room) {
			const index = room.players.findIndex(p => p.id === player.id);
			if (index !== -1) {
				room.players[index] = player;
				this.rooms.set(room.id, room);
			}
		}
	}

	public setRoomOwner(roomId: number, playerId: number): void {
		const game = this.getRoom(roomId);
		if (game) {
			const player = game.players.find(player => player.id === playerId);
			if (player) {
				game.owner_id = playerId;
				game.owner_username = player.username;
				this.rooms.set(roomId, game);
			}
		}
	}

	public removePlayerFromRoom(room: room, playerId: number): void {
		if (room) {
			if (room.owner_id === playerId) {
				const newOwner = room.players.find(player => player.id !== playerId);
				if (!newOwner) return this.removeRoom(room.id);
				room.owner_id = newOwner.id;
				room.owner_username = newOwner.username;
				room.players = room.players.filter(player => player.id !== newOwner.id);
				room.players.unshift(newOwner);
			}
			room.players = room.players.filter(player => player.id !== playerId);
			this.rooms.set(room.id, room);
			room.engine?.removePlayer(playerId);
		}
	}

	public removePlayerFromAllRoom(playerId: number): void {
		for (const room of this.rooms.values()) {
			this.removePlayerFromRoom(room, playerId);
		}
	}

	public updateRoomState(roomId: number, state: GameState): void {
		const game = this.rooms.get(roomId);
		if (game) {
			game.state = state;
			this.rooms.set(roomId, game);
		}
	}

	public removeRoom(roomId: number): void {
		this.rooms.delete(roomId);
	}

	public getRoom(roomId: number): room | undefined {
		return this.rooms.get(roomId);
	}

	public getWaitingRooms(): room[] {
		return Array.from(this.rooms.values()).filter(game => game.state === 'waiting');
	}

	public getActiveRooms(): room[] {
		return Array.from(this.rooms.values()).filter(game => game.state === 'active');
	}

	public getRoomById(id: number): room | undefined {
		for (const game of this.rooms.values()) {
			if (game.id === id) {
				return game;
			}
		}
		return undefined;
	}

	public getRoomByPlayerId(playerId: number): room | undefined {
		for (const game of this.rooms.values()) {
			if (game.players.some(player => player.id === playerId)) {
				return game;
			}
		}
		return undefined;
	}

	public getRoomByName(name: string): room | undefined {
		for (const game of this.rooms.values()) {
			if (game.name === name) {
				return game;
			}
		}
		return undefined;
	}

}

class StateManager {
	private static instance: StateManager;
	private PlayerRoom: Map<number, player> = new Map();
	private PlayerRoomWs: Map<number, WebSocket> = new Map();
	private PlayerGame: Map<number, player> = new Map();
	private PlayerGameWs: Map<number, WebSocket> = new Map();
	public RoomManager: RoomManager = RoomManager.getInstance();

	private constructor() { }

	static getInstance(): StateManager {
		if (!StateManager.instance) {
			StateManager.instance = new StateManager();
		}
		return StateManager.instance;
	}

	public sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	public addPlayer(ws: WebSocket, player: player): void {
		this.PlayerRoom.set(player.id, player);
		if (ws) this.PlayerRoomWs.set(player.id, ws);
	}

	public getPlayerWs(playerId: number): WebSocket | undefined {
		return this.PlayerRoomWs.get(playerId);
	}

	public joinRoomSpectator(room: room, player: player, playerws: WebSocket): void {
		if (this.RoomManager.PlayerInRoom(player.id)) return;
		if (room) {
			player.isSpectator = true;
			room.players.push(player);
			room.engine?.addSpectator(player, playerws);
			this.PlayerGame.set(player.id, player);
			this.PlayerGameWs.set(player.id, playerws);
			this.PlayerRoomWs.delete(player.id);
			this.PlayerRoom.set(player.id, player);
			this.RoomManager.updatePlayerInRoom(room, player);
		}
	}

	public leaveRoomSpectator(room: room, player: player): void {
		room.players = room.players.filter(player => player.id !== player.id);
		room.engine?.removeSpectator(player);
		const ws = this.PlayerGameWs.get(player.id);
		this.PlayerGame.delete(player.id);
		this.PlayerGameWs.delete(player.id);
		this.PlayerRoomWs.set(player.id, this.PlayerGameWs.get(player.id));
		this.PlayerRoom.set(player.id, player);
		this.RoomManager.updatePlayerInRoom(room, player);
		const tmp = new Map<number, WebSocket>();
		tmp.set(player.id, ws);
		console.log(`Leaving spectator mode for player ${player.username} (${player.id})`);
		this.sendRooms(tmp);
	}

	public removePlayer(playerId: number): void {
		this.PlayerRoom.delete(playerId);
		this.RoomManager.removePlayerFromAllRoom(playerId);
		this.PlayerRoomWs.delete(playerId);
	}

	public removePlayerGame(player: player, ws: WebSocket): void {
		this.RoomManager.removePlayerFromAllRoom(player.id);
		this.PlayerRoom.set(player.id, player);
		this.PlayerRoomWs.set(player.id, ws);
		this.PlayerGame.delete(player.id);
		this.PlayerGameWs.delete(player.id);
	}

	public stopGame(game: room): void {
		if (game) {
			const tmp = new Map<number, WebSocket>();
			for (const player of game.players) {
				player.gameId = null;
				const ws = this.PlayerGameWs.get(player.id);
				player.room = null;
				this.PlayerGame.delete(player.id);
				this.PlayerGameWs.delete(player.id);
				this.PlayerRoom.set(player.id, player);
				this.PlayerRoomWs.set(player.id, this.PlayerGameWs.get(player.id));
				tmp.set(player.id, ws);
			}
			for (const [spectator, ws] of game.engine?.Spectators || []) {
				this.PlayerGame.delete(spectator.id);
				this.PlayerGameWs.delete(spectator.id);
				this.PlayerRoom.set(spectator.id, spectator);
				this.PlayerRoomWs.set(spectator.id, ws);
				spectator.gameId = null;
				spectator.room = null;
				spectator.isSpectator = false;
				tmp.set(spectator.id, ws);
			}
			this.RoomManager.removeRoom(game.id);
			this.sendRooms(tmp);
		}
	}

	public startGame(room: room): void {
		if (room) {
			room.state = 'active';
			room.startTime = Date.now();
			this.RoomManager.updateRoomState(room.id, 'active');
			const playersws = new Map<number, WebSocket>();
			for (const player of room.players) {
				const ws = this.PlayerRoomWs.get(player.id);
				if (ws) playersws.set(player.id, ws);
			}

			room.engine = new Engine(room, playersws);
			room.engine.start();
			room.players.forEach((p: player) => {
				p.gameId = room.id;
			});
			// enlever les joueurs de la liste des joueurs
			for (const player of room.players) {
				this.PlayerRoom.delete(player.id);
				this.PlayerGame.set(player.id, player);
				this.PlayerGameWs.set(player.id, this.PlayerRoomWs.get(player.id));
				this.PlayerRoomWs.delete(player.id);
			}
		}
	}

	public async loopRooms(): Promise<void> {
		while (true) {
			const activeRooms = this.RoomManager.getActiveRooms();
			const now = Date.now();

			for (const player of this.PlayerRoom.values()) {
				if (now - player.updateAt > 10000) {
					this.RoomManager.removePlayerFromAllRoom(player.id);
					this.removePlayer(player.id);
					this.sendRooms();
				}
			}

			for (const room of activeRooms) {
				if (room.engine) {
					if (room.engine.isFinished()) {
						this.stopGame(room);
						this.sendRooms();
					}
				}
			}

			await this.sleep(250);
		}
	}

	public sendRooms(playerws: Map<number, WebSocket> | null = null): void {
		playerws = playerws || this.PlayerRoomWs;
		const waitingGames = this.RoomManager.getWaitingRooms();
		const activeGames = this.RoomManager.getActiveRooms();
		for (const [id, ws] of playerws) {
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				this.PlayerRoomWs.delete(id);
				this.PlayerRoom.delete(id);
				continue;
			}
			let rooms = {
				action: 'getrooms',
				waiting: waitingGames,
				active: activeGames,
			};
			if (this.RoomManager.PlayerInRoom(id)) {
				rooms.waiting = rooms.waiting
					.filter(room => room.players.some(player => player.id === id))
					.map(room => ({
						...room,
						engine: null,
						players: room.players.map(player => ({
							id: player.id,
							username: player.username,
							avatar: player.avatar,
							lang: player.lang,
							updateAt: player.updateAt,
							gameId: player.gameId,
							elo: player.elo,
						})),
						numberOfPlayers: room.players.length,
					}));
				rooms.active = rooms.active
					.filter(room => room.players.some(player => player.id === id))
					.map(room => ({
						...room,
						engine: null,
						players: room.players.map(player => ({
							id: player.id,
							username: player.username,
							avatar: player.avatar,
							lang: player.lang,
							updateAt: player.updateAt,
							gameId: player.gameId,
							elo: player.elo,
						})),
						numberOfPlayers: room.players.length,
					}));
			} else {
				rooms.waiting = rooms.waiting.map(room => ({
					id: room.id,
					name: room.name,
					numberOfPlayers: room.players.length,
					owner_id: room.owner_id,
					owner_username: room.owner_username,
					state: room.state,
					settings: room.settings,
					engine: null,
					players: [],
				}));
				rooms.active = rooms.active.map(room => ({
					id: room.id,
					name: room.name,
					numberOfPlayers: room.players.length,
					owner_id: room.owner_id,
					owner_username: room.owner_username,
					state: room.state,
					settings: room.settings,
					engine: null,
					players: [],
				}));
			}
			ws.send(JSON.stringify(rooms));
		}
	}
}

export default StateManager.getInstance();