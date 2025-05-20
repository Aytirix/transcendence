// Engine.ts
import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';
import PacmanMap from './map/Map';
import Ghost from "./Character/Ghost";
import Pacman from "./Character/Pacman";

const TILE_SIZE = 32;

/**
 * Classe principale du moteur de jeu Pac-Man
 */
export default class Engine {
	private players: Map<number, Ghost | Pacman> = new Map();
	private map: PacmanMap;
	private tickRate = 1000 / 60; // 60 FPS
	private lastTime = Date.now();
	private intervalId: NodeJS.Timeout | null = null;
	private sockets: Map<number, WebSocket> = new Map();
	private isPaused: boolean = false;
	private PauseMessage: string = "";

	constructor(rawLayout: string[], initialPlayers: player[], initialPlayerSockets: Map<number, WebSocket>) {
		this.map = new PacmanMap(rawLayout);
		this.sockets = initialPlayerSockets;
		this.addPlayer(initialPlayers);
	}

	public getPlayerById(id: number): Ghost | Pacman | undefined {
		return this.players.get(id);
	}

	/**
	 * Ajout d'un joueur au moteur
	 */
	public addPlayer(players: player[]): void {
		// Déterminer les personnages disponibles: Pacman et fantômes
		const characters = [CharacterType.Pacman, CharacterType.Blinky, CharacterType.Inky, CharacterType.Pinky, CharacterType.Clyde];
		const usedCharacters = new Set<string>(
			Array.from(this.players.values()).map(p => p.nameChar)
		);

		// Filtrer les personnages disponibles
		const availableCharacters = characters.filter(c => !usedCharacters.has(c));

		players.forEach(p => {
			// Si cest le premier
			let spawnIndex;
			let spawns;
			let player: Ghost | Pacman;
			let characterType: CharacterType;
			if (this.players.size === 0) {
				characterType = CharacterType.Pacman;
				spawns = this.map.getSpawnPositions()[CharacterType.Pacman];
				spawnIndex = this.players.size % availableCharacters.length;
			} else {
				const randomIndex = Math.floor(Math.random() * availableCharacters.length);
				const characterType = availableCharacters[randomIndex];

				spawns = this.map.getSpawnPositions()[characterType];
				spawnIndex = this.players.size % spawns.length;
			}
			const position = this.gridToPixel(spawns[spawnIndex]);

			if (characterType === CharacterType.Pacman) player = new Pacman(p, position, characterType);
			else player = new Ghost(p, position, characterType);

			this.players.set(p.id, player);
		});
	}

	public updatePlayer(player: player, ws: WebSocket): void {
		if (this.players.has(player.id)) {
			const existingPlayer = this.players.get(player.id);
			if (existingPlayer) {
				existingPlayer.player = player;
				this.players.set(player.id, existingPlayer);
				this.sockets.set(player.id, ws);
			}
		}
	}

	/**
	 * Démarre la boucle de jeu
	 */
	public start(): void {
		this.lastTime = Date.now();
		this.intervalId = setInterval(() => this.gameLoop(), this.tickRate);
	}

	/**
	 * Arrête la boucle de jeu
	 */
	public stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Met le jeu en pause sans arrêter complètement la boucle
	 * @returns true si le jeu a été mis en pause, false s'il était déjà en pause
	 */
	public pause(msg: string): boolean {
		if (this.isPaused || !this.intervalId) {
			return false;
		}
		this.isPaused = true;
		this.PauseMessage = msg;
		return true;
	}

	/**
	 * Reprend le jeu après une pause
	 * @returns true si le jeu a repris, false s'il n'était pas en pause
	 */
	public resume(): boolean {
		if (!this.isPaused || !this.intervalId) {
			return false;
		}

		this.isPaused = false;
		this.lastTime = Date.now(); // Réinitialiser le temps pour éviter les sauts
		return true;
	}

	/**
	* Vérifie si le jeu est actuellement en pause
	*/
	public isGamePaused(): boolean {
		return this.isPaused;
	}

	/**
	 * Boucle principale de mise à jour et diffusion de l'état
	 */
	private gameLoop(): void {
		const now = Date.now();
		const delta = now - this.lastTime;
		this.lastTime = now;

		if (!this.isPaused) {
			this.update(delta);
			this.broadcastState();
		}
	}

	/**
	 * Convertit une position en coordonnées de grille vers des coordonnées en pixels
	 */
	private gridToPixel(gridPos: vector2): vector2 {
		return {
			x: gridPos.x * TILE_SIZE,
			y: gridPos.y * TILE_SIZE
		};
	}

	/**
	 * Convertit une position en pixels vers des coordonnées de grille
	 */
	private pixelToGrid(pixelPos: vector2): vector2 {
		return {
			x: Math.floor(pixelPos.x / TILE_SIZE),
			y: Math.floor(pixelPos.y / TILE_SIZE)
		};
	}

	private calculateNextPosition(pl: Ghost | Pacman, delta: number): vector2 {
		const speed = pl.nameChar === CharacterType.Pacman ? Pacman.speed : Ghost.speed;

		const currentGridPos = this.pixelToGrid(pl.position);

		const nextGridPos = {
			x: currentGridPos.x + pl.nextDirection.x,
			y: currentGridPos.y + pl.nextDirection.y
		};
		const isWalkable = this.map.isWalkable(nextGridPos);
		if (isWalkable) {
			pl.direction = pl.nextDirection;
		}

		return {
			x: Math.round(pl.position.x + pl.direction.x * speed * (delta / 16)),
			y: Math.round(pl.position.y + pl.direction.y * speed * (delta / 16))
		};
	}

	private debug(): void {
		console.log("=== ÉTAT ACTUEL DU JEU (DÉBOGAGE) ===");

		// Obtenir une copie de la grille
		const mapLines = this.map.toString(false);
		const displayMap = [...mapLines];

		// Ajouter les joueurs à la représentation
		this.players.forEach(pl => {
			const gridPos = this.pixelToGrid(pl.position);

			// Vérifier que la position est dans les limites
			if (gridPos.y >= 0 && gridPos.y < displayMap.length &&
				gridPos.x >= 0 && gridPos.x < displayMap[gridPos.y].length) {

				// Remplacer le caractère à la position du joueur par son symbole
				const rowChars = displayMap[gridPos.y].split('');
				rowChars[gridPos.x] = pl.nameChar;
				displayMap[gridPos.y] = rowChars.join('');
			}
		});

		// Afficher la carte avec les joueurs
		console.log("Carte avec joueurs:");
		console.log(displayMap.join('\n'));

		// Afficher les informations des joueurs
		console.log("\nJoueurs:");
		this.players.forEach(player => {
			const gridPos = this.pixelToGrid(player.position);
			console.log(`${player.nameChar} (ID: ${player.player.id}):
				- Position pixel [${player.position.x}, ${player.position.y}]
				- Position grille [${gridPos.x}, ${gridPos.y}]
				- Direction [${player.direction?.x || 0}, ${player.direction?.y || 0}]
				- Score: ${player.score}`);
		});

		// Afficher d'autres statistiques
		console.log("\nStatistiques:");
		console.log(`Pastilles restantes: ${this.map.countRemainingPellets()}`);
		console.log(`Taille de tuile: ${TILE_SIZE}px`);
		console.log("=====================================");
	}

	/**
	 * Met à jour la logique de jeu
	 */
	private update(delta: number): void {
		this.players.forEach(player => {
			if (!player.direction) return;

			// Calculer la prochaine position en pixels
			const nextPos: vector2 = this.calculateNextPosition(player, delta);

			// Convertir en coordonnées de grille pour vérification
			const nextGridPos = this.pixelToGrid(nextPos);

			// Vérifier si la position est marcheable
			if (this.map.isWalkable(nextGridPos)) {
				player.position = nextPos;
			}

			// Vérifier les téléporteurs en coordonnées de grille
			const gridPos = this.pixelToGrid(player.position);
			const tp = this.map.getTeleportDestination(gridPos);
			if (tp) {
				player.position = this.gridToPixel(tp);
			}

			if (player.nameChar === CharacterType.Pacman) {
				this.map.consumePelletOrBonus(player, gridPos);
			}
		});
		this.debug();
	}

	/**
	 * Envoie l'état du jeu à tous les clients
	 */
	private broadcastState(): void {
		const state = {
			action: 'update', 
			data: {
				players: Array.from(this.players.values()).map(p => ({ id: p.player.id, position: p.position, score: p.score })),
				grid: this.map.toString(),
				paused: { paused: this.isPaused, message: this.PauseMessage }
			}
		};
		this.sockets.forEach(ws => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(state));
			}
		});
	}
}
