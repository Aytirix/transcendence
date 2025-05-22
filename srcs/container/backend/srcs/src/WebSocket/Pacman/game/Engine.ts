// Engine.ts
import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';
import PacmanMap from './map/Map';
import Ghost from "./Character/Ghost";
import Pacman from "./Character/Pacman";

export const TILE_SIZE = 50;
export const PLAYER_SPEED = 3;

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

	// Ajout des propriétés pour le mode effrayé
	private isFrightened: boolean = false;
	private frightenedEndTime: number = 0;
	private static FRIGHTENED_DURATION = 8000; // 8 secondes en mode effrayé
	private static FRIGHTENED_SPEED = 1.5 // Vitesse réduite en mode effrayé

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
		let availableCharacters = characters.filter(c => !usedCharacters.has(c));

		players.forEach(p => {
			// Si c'est le premier
			let spawnIndex;
			let spawns;
			let player: Ghost | Pacman;
			let characterType: CharacterType;
			if (this.players.size === 0) {
				characterType = CharacterType.Pacman;
				spawns = this.map.getSpawnPositions()[CharacterType.Pacman];
				spawnIndex = this.players.size % availableCharacters.length;
				availableCharacters = availableCharacters.filter(c => c !== CharacterType.Pacman);
			} else {
				const randomIndex = Math.floor(Math.random() * availableCharacters.length);
				characterType = availableCharacters[randomIndex];

				spawns = this.map.getSpawnPositions()[characterType];
				spawnIndex = this.players.size % spawns.length;
				availableCharacters = availableCharacters.filter(c => c !== characterType);
			}

			// Conversion grille → pixel en centrant
			const position = this.gridToPixel(spawns[spawnIndex]);
			console.log(`Player ${p.username} (${p.id}) spawned at ${position.x}, ${position.y} with character ${characterType}`);

			if (characterType === CharacterType.Pacman) player = new Pacman(p, position, characterType);
			else player = new Ghost(p, position, characterType, this.map);
			player.nameChar = characterType;

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
		const state = {
			action: 'startGame',
			data: {
				players: Array.from(this.players.values()).map(p => (
					{
						id: p.player.id,
						name: p.player.username,
						character: p.nameChar,
						position: p.position,
						score: p.score
					})),
				tileSize: TILE_SIZE,
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
	 * Boucle principale de mise à jour et diffusion de l'état
	 */
	private gameLoop(): void {
		const now = Date.now();
		const delta = now - this.lastTime;
		this.lastTime = now;

		if (!this.isPaused) {
			let pacmanInstance: Pacman | undefined;
			this.players.forEach(player => {
				if (player.nameChar === CharacterType.Pacman) pacmanInstance = player as Pacman;
			});

			if (this.isFrightened && Date.now() > this.frightenedEndTime) {
				this.unsetFrightened();
			}

			// Mettre à jour le comportement des fantômes
			this.players.forEach(player => {
				if (player instanceof Ghost && now - player.player.updateAt > 2000) {
					(player as Ghost).updateBehaviour(
						pacmanInstance,
						this.players as Map<number, Ghost>
					);
				}
			}
			);
			this.update(delta);
		}
		this.broadcastState();
	}

	/**
	 * Convertit une position en coordonnées de grille vers des coordonnées en pixels (centré)
	 */
	private gridToPixel(gridPos: vector2): vector2 {
		return {
			x: gridPos.x * TILE_SIZE + TILE_SIZE / 2,
			y: gridPos.y * TILE_SIZE + TILE_SIZE / 2
		};
	}

	/**
	 * Convertit une position en pixels (centré) vers des coordonnées en grille
	 */
	private pixelToGrid(pixelPos: vector2): vector2 {
		// Comme pixelPos.x = grid * TILE_SIZE + TILE_SIZE/2, on peut juste faire floor(pixelPos / TILE_SIZE)
		return {
			x: Math.floor(pixelPos.x / TILE_SIZE),
			y: Math.floor(pixelPos.y / TILE_SIZE)
		};
	}

	private calculateNextPosition(pl: Ghost | Pacman, delta: number): vector2 {
		if (!pl.direction) {
			pl.direction = { x: 0, y: 0 };
			return { ...pl.position };
		}

		// Set the appropriate speed based on character type and state
		let speed = Pacman.speed;
		if (pl instanceof Ghost) {
			if (pl.isReturningToSpawn) speed = Ghost._speedRespawn;
			else speed = pl.isFrightened ? Engine.FRIGHTENED_SPEED : Ghost._speed;
		}

		const currentGridPos = this.pixelToGrid(pl.position);

		// Centre exact de la tuile courante
		const exactCenterX = currentGridPos.x * TILE_SIZE + TILE_SIZE / 2;
		const exactCenterY = currentGridPos.y * TILE_SIZE + TILE_SIZE / 2;
		const AlignementTolerance = 1;
		const isAligned = Math.abs(pl.position.x - exactCenterX) <= AlignementTolerance &&
			Math.abs(pl.position.y - exactCenterY) <= AlignementTolerance;
		const directionOpposite = (pl.direction.x !== 0 && pl.nextDirection.x !== 0) || (pl.direction.y !== 0 && pl.nextDirection.y !== 0);

		// Gestion du changement de direction si on est centré
		if ((isAligned || directionOpposite) && pl.nextDirection && (pl.nextDirection.x !== 0 || pl.nextDirection.y !== 0)) {
			const nextDirectionGridPos = {
				x: currentGridPos.x + pl.nextDirection.x,
				y: currentGridPos.y + pl.nextDirection.y
			};
			if (this.map.isWalkable(pl.nameChar, nextDirectionGridPos)) {
				pl.direction = { ...pl.nextDirection };
			}
		}

		// Calcule la position désirée du centre après déplacement
		const velocityX = pl.direction.x * speed * (delta / 16);
		const velocityY = pl.direction.y * speed * (delta / 16);
		const desiredCenterX = pl.position.x + velocityX;
		const desiredCenterY = pl.position.y + velocityY;

		let finalCenterX = desiredCenterX;
		let finalCenterY = desiredCenterY;

		// --- Collision HORIZONTALE via le bord du sprite ---
		if (pl.direction.x !== 0) {
			if (pl.direction.x > 0) {
				// On regarde l'arête droite du sprite après déplacement
				const rightEdge = desiredCenterX + TILE_SIZE / 2;
				const gridX_of_rightEdge = Math.floor(rightEdge / TILE_SIZE);
				// Si la case à droite (même Y) est un mur, on clamp le centre X
				if (!this.map.isWalkable(pl.nameChar, { x: gridX_of_rightEdge, y: currentGridPos.y })) {
					// Centre bloqué juste à gauche du mur = bord de la case courante + demi-tile
					finalCenterX = currentGridPos.x * TILE_SIZE + TILE_SIZE / 2;
				}
			} else {
				// Vers la gauche → on regarde l'arête gauche du sprite après déplacement
				const leftEdge = desiredCenterX - TILE_SIZE / 2;
				const gridX_of_leftEdge = Math.floor(leftEdge / TILE_SIZE);
				if (!this.map.isWalkable(pl.nameChar, { x: gridX_of_leftEdge, y: currentGridPos.y })) {
					// Centre bloqué juste à droite du mur = bord de la case courante - demi-tile
					finalCenterX = (currentGridPos.x + 1) * TILE_SIZE - TILE_SIZE / 2;
				}
			}
		}

		// --- Collision VERTICALE via le bord du sprite ---
		if (pl.direction.y !== 0) {
			if (pl.direction.y > 0) {
				// Vers le bas = on regarde l'arête inférieure
				const bottomEdge = desiredCenterY + TILE_SIZE / 2;
				const gridY_of_bottomEdge = Math.floor(bottomEdge / TILE_SIZE);
				if (!this.map.isWalkable(pl.nameChar, { x: currentGridPos.x, y: gridY_of_bottomEdge })) {
					// Centre bloqué juste au-dessus du mur = bord inférieur de la case courante - demi-tile
					finalCenterY = currentGridPos.y * TILE_SIZE + TILE_SIZE / 2;
				}
			} else {
				// Vers le haut → on regarde l'arête supérieure
				const topEdge = desiredCenterY - TILE_SIZE / 2;
				const gridY_of_topEdge = Math.floor(topEdge / TILE_SIZE);
				if (!this.map.isWalkable(pl.nameChar, { x: currentGridPos.x, y: gridY_of_topEdge })) {
					// Centre bloqué juste en-dessous du mur = bord supérieur de la case courante + demi-tile
					finalCenterY = (currentGridPos.y + 1) * TILE_SIZE - TILE_SIZE / 2;
				}
			}
		}

		// On renvoie la position du centre (après clamp éventuel)
		return { x: Math.round(finalCenterX), y: Math.round(finalCenterY) };
	}

	/**
	 * Active le mode frightened (fuite) lorsque Pac-Man mange une super pastille
	 */
	public setFrightened(): void {
		this.isFrightened = true;
		this.frightenedEndTime = Date.now() + Engine.FRIGHTENED_DURATION;
		Ghost._speed = Engine.FRIGHTENED_SPEED;

		// Inverser la direction immédiatement (comportement original)
		for (const player of this.players.values()) {
			if (player instanceof Ghost) {
				player.isFrightened = true;
				player.reverseDirection();
			}
		}
	}

	/**
	 * Désactive le mode frightened
	 */
	public unsetFrightened(): void {
		this.isFrightened = false;
		for (const player of this.players.values()) {
			if (player instanceof Ghost) player.isFrightened = false;
		}
		Ghost._speed = PLAYER_SPEED;
	}

	private debug(): void {
		console.log("=== ÉTAT ACTUEL DU JEU (DÉBOGAGE) ===");

		// Obtenir une copie de la grille
		const mapLines = this.map.toString();
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
				- Position pixel [${player.position.x}, ${player.position.y}] (centré)
				- Position grille [${gridPos.x}, ${gridPos.y}]
				- Direction      [${player.direction?.x || 0}, ${player.direction?.y || 0}]
				- DirectionNexyt [${player.nextDirection?.x || 0}, ${player.nextDirection?.y || 0}]
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

			// Calcule la prochaine position du centre en pixels
			const nextCenter: vector2 = this.calculateNextPosition(player, delta);

			// On met à jour la position du sprite
			player.position = nextCenter;

			// Recalcul du gridPos une fois qu'on est bien dans une case valide
			const gridPos = this.pixelToGrid(player.position);

			// Vérifier les téléporteurs
			const tp = this.map.getTeleportDestination(gridPos);
			if (tp && !player.teleport) {
				player.teleport = true;
				player.position = tp;
			} else if (!tp) player.teleport = false;

			// Si c'est Pac-Man, consommer éventuellement une pastille
			if (player.nameChar === CharacterType.Pacman) {
				if (this.map.consumePelletOrBonus(player, gridPos) == 50) this.setFrightened();
				this.checkGhostPacmanCollision(player as Pacman);
			}
		});

		// Débogage si besoin
		// this.debug();
	}

	/**
	 * Vérifie les collisions entre les fantômes et Pac-Man
	 * @returns true si un fantôme a mangé Pac-Man
	 */
	private checkGhostPacmanCollision(pacman: Pacman): boolean {

		for (const ghost of this.players.values()) {
			if (ghost instanceof Pacman) continue;
			// Distance entre les centres
			const dx = ghost.position.x - pacman.position.x;
			const dy = ghost.position.y - pacman.position.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < TILE_SIZE * 0.8) {
				if (ghost.isFrightened) {
					// Pac-Man mange le fantôme effrayé
					console.log(`Pacman a mangé le fantôme ${ghost.nameChar}`);
					ghost.isFrightened = false;
					ghost.respawn();
					pacman.score += 200;
				} else if (ghost.isReturningToSpawn) {
					// Fantôme mange Pac-Man
					ghost.score += 300;
					// pacman.die();
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Envoie l'état du jeu à tous les clients
	 */
	private broadcastState(): void {
		const state = {
			action: 'updateGame',
			data: {
				players: Array.from(this.players.values()).map(p => ({
					id: p.player.id,
					username: p.player.username,
					character: p.nameChar,
					position: p.position,
					score: p.score,
					direction: p.direction,
					isFrightened: p instanceof Ghost ? p.isFrightened : false,
					returnToSpawn: p instanceof Ghost ? p.isReturningToSpawn : false
				})),
				grid: this.map.toString(),
				paused: { paused: this.isPaused, message: this.PauseMessage },
				frightenedState: {
					active: this.isFrightened,
					remainingTime: this.isFrightened ? Math.max(0, this.frightenedEndTime - Date.now()) : 0
				}
			}
		};
		this.sockets.forEach(ws => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(state));
			}
		});
	}
}
