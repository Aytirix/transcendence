// Engine.ts
import { player, room, GameState, vector2, CharacterType, room_settings } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';
import PacmanMap from './map/Map';
import Ghost from "./Character/Ghost";
import Pacman from "./Character/Pacman";

export const TILE_SIZE = 50;
export const PACMAN_SPEED = 3;
export const GHOST_SPEED = 2.5;

/**
 * Classe principale du moteur de jeu Pac-Man
 */
export default class Engine {
	private players: Map<number, Ghost | Pacman> = new Map();
	public Spectators: Map<player, WebSocket> = new Map();
	private map: PacmanMap;
	private tickRate = 1000 / 60;
	private lastTime = Date.now();
	private intervalId: NodeJS.Timeout | null = null;
	public sockets: Map<number, WebSocket> = new Map();
	private isPaused: boolean = false;
	private PauseMessage: string = "";
	private Finished: boolean = false;
	public trainingAI: boolean = false;
	private trainingLastPause = Date.now() - 10000; // Pour éviter de bloquer l'IA au démarrage
	private win: 'pacman' | 'ghosts' | null = null;
	private reward: number = 0;

	// Ajout des propriétés pour le mode effrayé
	private isFrightened: boolean = false;
	private pacmanKillFrightened: number = 0;
	private frightenedEndTime: number = 0;
	private static FRIGHTENED_DURATION = 8000; // 8 secondes en mode effrayé
	private static FRIGHTENED_SPEED = 1.5 // Vitesse réduite en mode effrayé

	constructor(room: room, initialPlayerSockets: Map<number, WebSocket>) {

		this.map = new PacmanMap(room.settings.map.map);
		this.sockets = initialPlayerSockets;

		// Vérifier si un joueur est une IA pour le mode entraînement
		for (const player of room.players) {
			if (player.username.startsWith('PacmanAI')) {
				this.trainingAI = true;
				break;
			}
		}

		this.addPlayers(room.players);
	}

	public getPlayerById(id: number): Ghost | Pacman | undefined {
		return this.players.get(id);
	}

	/**
	 * Ajout d'un joueur au moteur
	 */
	private addPlayers(players: player[]): void {
		// Déterminer les personnages disponibles: Pacman et fantômes
		const characters = [CharacterType.Pacman, CharacterType.Blinky, CharacterType.Inky, CharacterType.Pinky, CharacterType.Clyde];
		const usedCharacters = new Set<string>(
			Array.from(this.players.values()).map(p => p.nameChar)
		);

		// Si c'est le mode entraînement, on force PacmanAI à être Pacman
		if (this.trainingAI) usedCharacters.add(CharacterType.Pacman);

		// Filtrer les personnages disponibles
		let availableCharacters = characters.filter(c => !usedCharacters.has(c));

		players.forEach(p => {
			let spawnIndex = 0;
			let spawns: vector2[] = [];
			let player: Ghost | Pacman;
			let characterType: CharacterType;
			if ((this.trainingAI && p.username.startsWith('PacmanAI')) || p.username === 'user1') {
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

			if (characterType === CharacterType.Pacman) player = new Pacman(p, position, characterType);
			else player = new Ghost(p, position, characterType, this.map);
			player.nameChar = characterType;

			this.players.set(p.id, player);
		});
	}

	public removePlayer(playerId: number): void {
		if (this.players.has(playerId)) {

			const allPlayerIds = Array.from(this.players.keys());
			const minId = Math.min(...allPlayerIds, 0);
			const botPlayer: player = {
				id: minId - 1,
				username: 'bot' + Math.abs(minId - 1),
				updateAt: Date.now(),
				avatar: '',
				lang: 'en',
				elo: 1000,
				gameId: this.players.get(playerId)?.player.gameId,
				isSpectator: false,
				room: this.players.get(playerId)?.player.room,
			};

			if (this.players.get(playerId)?.nameChar === CharacterType.Pacman) {
				this.stop("Pacman left, resetting all players to spawn positions");
				// prendre un joueur fantôme au hasard pour le remplacer
				const ghostPlayers = Array.from(this.players.values()).filter(p => p instanceof Ghost && p.player.id > 0);
				if (ghostPlayers.length > 0) {
					const randomGhost = ghostPlayers[Math.floor(Math.random() * ghostPlayers.length)];

					const botGhost = new Ghost(botPlayer, randomGhost.position, randomGhost.nameChar, this.map);
					this.players.set(botPlayer.id, botGhost);
					const pacmanPlayer = new Pacman(randomGhost.player, randomGhost.position, CharacterType.Pacman);
					this.players.set(pacmanPlayer.player.id, pacmanPlayer);
				}
				this.players.delete(playerId);
				this.sockets.delete(playerId);
				this.resetAllPlayerPositions();
				if (this.players.size === 0 || Array.from(this.players.keys()).every(id => id < 0)) {
					this.stop('No players left, stopping the game');
					this.Finished = true;
					return;
				}
				setTimeout(() => {
					this.start();
				}, 2000);
			}
			else {
				const botGhost = new Ghost(botPlayer, this.players.get(playerId).position, this.players.get(playerId).nameChar, this.map);
				this.players.delete(playerId);
				this.sockets.delete(playerId);
				this.players.set(botPlayer.id, botGhost);
			}
		}

		if (this.players.size === 0 || Array.from(this.players.keys()).every(id => id < 0)) {
			this.stop('No players left, stopping the game');
			this.Finished = true;
			return;
		}
	}

	/**
	 * Resets the positions of all players (ghosts and Pacman) to their spawn points
	 * @returns boolean indicating if the reset was successful
	 */
	public resetAllPlayerPositions(): boolean {
		let allResetSuccessful = true;

		this.players.forEach((player, playerId) => {
			// Get appropriate spawn position based on character type
			const spawns = this.map.getSpawnPositions()[player.nameChar];
			if (!spawns || spawns.length === 0) {
				allResetSuccessful = false;
				return;
			}

			// Reset to the first spawn position for this character type
			const position = this.gridToPixel(spawns[0]);
			player.position = position;

			// Reset direction
			player.direction = { x: 0, y: 0 };
			player.nextDirection = { x: 0, y: 0 };

			// Reset state for ghosts
			if (player instanceof Ghost) {
				player.isReturningToSpawn = false;
				player.isFrightened = false;
			}
		});

		// Reset frightened mode
		this.isFrightened = false;

		return allResetSuccessful;
	}

	public updatePlayer(player: player, ws: WebSocket): void {
		if (this.players.has(player.id)) {
			const existingPlayer = this.players.get(player.id);
			if (existingPlayer) {
				existingPlayer.player = player;
				this.players.set(player.id, existingPlayer);
				this.sockets.set(player.id, ws);
			}
		} else {
			for (const [spectatorPlayer, spectatorWs] of this.Spectators) {
				if (spectatorPlayer.id === player.id) {
					this.Spectators.delete(spectatorPlayer);
					this.Spectators.set(player, ws);
					this.Spectators.set(player, ws);
					player.isSpectator = true;
					break;
				}
			}
		}
	}

	/**
	 * Ajout d'un spectateur au moteur
	 */
	public addSpectator(player: player, ws: WebSocket): void {
		if (this.Spectators.has(player)) {
			this.Spectators.delete(player);
		}
		this.Spectators.set(player, ws);
	}

	/**
	 * Supprime un spectateur du moteur
	 */
	public removeSpectator(player: player): void {
		if (this.Spectators.has(player)) {
			this.Spectators.delete(player);
			player.isSpectator = false;
		}
	}

	public isFinished(): boolean {
		return this.Finished;
	}

	/**
	 * Démarre la boucle de jeu
	 */
	public start(): void {
		this.stop();

		if (this.trainingAI) {
			this.resume();
			setTimeout(() => {
				this.broadcastState();
				if (this.isFinished()) return;
				this.intervalId = setInterval(() => this.gameLoop(), this.tickRate);
			}, 100);
			return;
		}

		try {
			let countdown = 3;
			this.pause(`Starting in ${countdown}`);
			countdown--;
			this.broadcastState();
			const countdownInterval = setInterval(() => {
				if (countdown >= 1) {
					this.PauseMessage = `Starting in ${countdown}`;
					this.broadcastState();
				} else if (countdown == 0) {
					this.PauseMessage = "GOOOOOO !";
					this.broadcastState();
				} else {
					clearInterval(countdownInterval);
					this.resume();
					this.broadcastState();
					setTimeout(() => {
						this.resume();
						this.lastTime = Date.now();
						if (this.isFinished()) return;
						this.intervalId = setInterval(() => this.gameLoop(), this.tickRate);
					}, 500);
				}
				countdown--;
			}, 1000);
		} catch (error) {
			console.error("Error starting game loop:", error);
			this.stop("Error starting game loop");
			this.Finished = true;
			this.broadcastState();
		}
	}

	/**
	 * Arrête la boucle de jeu
	 */
	public stop(message: string = "Game stopped"): void {
		this.isPaused = true;
		this.PauseMessage = message;
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
		this.isPaused = true;
		this.PauseMessage = msg;
		return true;
	}

	/**
	 * Reprend le jeu après une pause
	 * @returns true si le jeu a repris, false s'il n'était pas en pause
	 */
	public resume(): boolean {
		this.isPaused = false;
		this.lastTime = Date.now();
		this.PauseMessage = "";
		this.trainingLastPause = Date.now();
		return true;
	}

	/**
	 * Boucle principale de mise à jour et diffusion de l'état
	 */
	private gameLoop(): void {
		const now = Date.now();
		const delta = now - this.lastTime;
		this.lastTime = now;

		try {
			this.reward = 0;
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
					if (player instanceof Ghost && (now - player.player.updateAt > 2000 || player.isReturningToSpawn)) {
						(player as Ghost).updateBehaviour(
							pacmanInstance,
							this.players as Map<number, Ghost>
						);
					}
					if (this.trainingAI && player instanceof Pacman) this.reward += -0.017;
				}
				);
				this.update(delta);
			}
			this.broadcastState();
		} catch (error) {
			console.error("Error in game loop:", error);
			this.stop('');
			this.Finished = true;
			this.broadcastState();
		}
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
		const AlignementTolerance = 2;
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
		this.pacmanKillFrightened = 0;
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
		Ghost._speed = PACMAN_SPEED;
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
			player.position = nextCenter;

			// Recalcul du gridPos une fois qu'on est bien dans une case valide
			const gridPos = this.pixelToGrid(player.position);

			// Si c'est Pac-Man, consommer éventuellement une pastille
			if (player.nameChar === CharacterType.Pacman) {
				// Vérifier les téléporteurs
				const tp = this.map.getTeleportDestination(gridPos);
				if (tp && !player.teleport) {
					player.teleport = true;
					player.position = tp;
				} else if (!tp) player.teleport = false;
				const reward = this.map.consumePelletOrBonus(player as Pacman, gridPos);
				if (reward > 0) {
					player.score += reward;
					if (reward == 50) this.setFrightened();
					this.reward += reward;
				}
				this.checkGhostPacmanCollision(player as Pacman);
				this.checkWinCondition();
			}
		});
		// this.debug();
	}

	/**
	 * Vérifie si Pac-Man a mangé toutes les pastilles
	 * @returns true si la partie est terminée (toutes les pastilles mangées)
	 */
	private checkWinCondition(): boolean {
		// Vérifier s'il reste des pastilles sur la carte
		const consumePelletOrBonus = this.map.countRemainingPellets();
		if (consumePelletOrBonus === 0) {
			// Arrêter le jeu
			this.stop();

			// Afficher un message de victoire
			this.win = 'pacman';
			const pacmanId = Array.from(this.players.values()).find(p => p instanceof Pacman)?.player.id;
			this.reward += 500;
			this.pause("Game finished!\nPacman wins!");
			this.broadcastState();

			// Après un délai, marquer la partie comme terminée
			setTimeout(() => {
				this.Finished = true;
			}, this.trainingAI ? 10 : 5000);
			return true;
		}
		return false;
	}

	/**
	 * Vérifie les collisions entre les fantômes et Pac-Man
	 * @returns true si un fantôme a mangé Pac-Man
	 */
	private checkGhostPacmanCollision(pacman: Pacman): void {

		for (const ghost of this.players.values()) {
			if (ghost instanceof Pacman) continue;
			// Distance entre les centres
			const dx = ghost.position.x - pacman.position.x;
			const dy = ghost.position.y - pacman.position.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < TILE_SIZE / 2) {
				if (ghost.isFrightened && !ghost.isReturningToSpawn) {
					this.pacmanKillFrightened += 1;
					ghost.respawn();
					pacman.score += 200 * this.pacmanKillFrightened;
					this.reward += 200 * this.pacmanKillFrightened;
					ghost.score -= 100;
				} else if (!ghost.isFrightened && !ghost.isReturningToSpawn) {
					ghost.score += 300;
					this.deadPacman(pacman, ghost);
				}
			}
		}
	}

	private deadPacman(pacman: Pacman, ghost: Ghost): void {
		this.stop();
		pacman.life -= 1;
		if (pacman.life >= 0) {
			const pacmanId = Array.from(this.players.values()).find(p => p instanceof Pacman)?.player.id;
			this.reward += -200;
			this.pause(`Pacman is dead!\nLives remaining ${pacman.life}`);
			this.broadcastState();
			// wait one second before hiding ghost
			setTimeout(() => {
				for (const player of this.players.values()) {
					if (player instanceof Ghost) {
						player.position = { x: -100, y: -100 };
					}
				}
				this.broadcastState();
			}, this.trainingAI ? 10 : 1000);

			setTimeout(() => {
				if (this.resetAllPlayerPositions()) {
					this.start();
				} else {
					this.PauseMessage = "Error: Unable to reset player positions.";
					this.Finished = true;
					this.broadcastState();
				}
			}, this.trainingAI ? 10 : 2000);
		} else {
			const pacmanId = Array.from(this.players.values()).find(p => p instanceof Pacman)?.player.id;
			this.reward += -500;
			this.pause("Game finished! Ghosts win!");
			this.win = 'ghosts';
			this.broadcastState();
			if (this.trainingAI) {
				this.Finished = true;
				return;
			}
			setTimeout(() => {
				this.stop('Game finished! Ghosts win!');
				this.Finished = true;
			}, 5000);
		}
	}

	/**
	 * Trouve tous les fantômes à moins de 10 cases du Pacman
	 * @returns Array des fantômes proches avec leur distance au Pacman
	 */
	public findGhostsNearPacman(): Array<{ ghost: Ghost, distance: number }> {
		const pacmanPlayer = Array.from(this.players.values()).find(p => p instanceof Pacman) as Pacman;
		if (!pacmanPlayer) return [];

		const pacmanGridPos = this.pixelToGrid(pacmanPlayer.position);
		const nearbyGhosts: Array<{ ghost: Ghost, distance: number }> = [];

		this.players.forEach(player => {
			if (player instanceof Ghost) {
				const ghostGridPos = this.pixelToGrid(player.position);

				// Calcul de la distance de Manhattan (cases)
				const distance = Math.abs(ghostGridPos.x - pacmanGridPos.x) +
					Math.abs(ghostGridPos.y - pacmanGridPos.y);

				if (distance <= 20) {
					nearbyGhosts.push({
						ghost: player,
						distance: distance
					});
				}
			}
		});

		// Trier par distance croissante
		return nearbyGhosts.sort((a, b) => a.distance - b.distance);
	}

	/**
	 * Envoie l'état du jeu à tous les clients
	 */
	private broadcastState(): void {
		if (this.trainingAI) this.broadcastStateAI();
		const state = {
			action: 'updateGame',
			data: {
				players: Array.from(this.players.values()).map(p => ({
					id: p.player.id,
					username: p.player.username,
					character: p.nameChar,
					position: p.position,
					positionGrid: this.pixelToGrid(p.position),
					score: p.score,
					direction: p.directionToString(),
					isFrightened: p instanceof Ghost ? p.isFrightened : false,
					returnToSpawn: p instanceof Ghost ? p.isReturningToSpawn : false
				})),
				numberOfPlayers: this.players.size,
				pacmanLife: Array.from(this.players.values()).find(p => p instanceof Pacman)?.life,
				grid: this.map.toString(),
				tileSize: TILE_SIZE,
				isSpectator: false,
				win: this.win,
				paused: { paused: this.isPaused, message: this.PauseMessage },
				frightenedState: {
					active: this.isFrightened,
					remainingTime: this.isFrightened ? Math.max(0, this.frightenedEndTime - Date.now()) : 0
				}
			}
		};
		if (!this.trainingAI) {
			this.sockets.forEach(ws => {
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify(state));
				}
			});
		}
		this.Spectators.forEach((ws, player) => {
			player.isSpectator = true;
			if (ws && ws.readyState === WebSocket.OPEN) {
				state.data.isSpectator = true;
				ws.send(JSON.stringify(state));
			} else {
				if (Date.now() - player.updateAt > 5000) {
					this.Spectators.delete(player);
					player.isSpectator = false;
				}
			}
		});
	}

	/**
	 * Envoie l'état du jeu à tous les clients
	 */
	private broadcastStateAI(): void {
		const diff = Date.now() - this.trainingLastPause;
		if ((this.win == null || this.Finished) && diff < 2000) {
			if (this.trainingAI && (diff <= 100 || this.isPaused || this.Finished)) {
				return;
			}
		}
		if (diff > 2000 && this.isPaused) {
			this.resume();
			this.trainingLastPause = Date.now();
		}

		const pacmanPlayer = Array.from(this.players.values()).find(p => p instanceof Pacman);
		const ghostPlayers = this.findGhostsNearPacman();
		const state = {
			action: 'updateGame',
			data: {
				pacman: pacmanPlayer ? {
					positionGrid: this.pixelToGrid(pacmanPlayer.position),
					score: pacmanPlayer.score,
					direction: pacmanPlayer.directionToString()
				} : null,
				ghosts: ghostPlayers.map(g => ({
					positionGrid: this.pixelToGrid(g.ghost.position),
					score: g.ghost.score,
					isFrightened: g.ghost.isFrightened,
					returnToSpawn: g.ghost.isReturningToSpawn,
					distanceToPacman: g.distance,
				})),
				grid: this.map.toString(),
				win: this.win,
				reward: this.reward,
				paused: { paused: this.isPaused, message: this.PauseMessage },
				frightenedState: {
					active: this.isFrightened,
					remainingTime: this.isFrightened ? Math.max(0, this.frightenedEndTime - Date.now()) : 0
				}
			}
		};
		if (pacmanPlayer) {
			const ws = this.sockets.get(pacmanPlayer.player.id);
			if (ws && ws.readyState === WebSocket.OPEN) {
				console.log(`Broadcasting state to AI pause: ${this.isPaused}, finished: ${this.Finished} diff: ${diff}ms`);
				ws.send(JSON.stringify(state));
			} else {
				console.warn(`WebSocket is not open for player ID ${pacmanPlayer.player.id}, removing from sockets.`);
				this.sockets.delete(pacmanPlayer.player.id);
				this.stop(`WebSocket closed for player ID ${pacmanPlayer.player.id}, stopping the game.`);
				this.Finished = true;
			}
		}
		if (this.win != null) this.Finished = true;
		this.win = null;
		this.pause('');
	}
}
