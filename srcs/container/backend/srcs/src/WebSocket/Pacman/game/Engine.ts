// Engine.ts
import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';
import PacmanMap from './map/Map';

const TILE_SIZE = 32;
const PACMAN_SPEED = 1;
const GHOST_SPEED = 0.5;

/**
 * Classe principale du moteur de jeu Pac-Man
 */
export default class Engine {
	private players: Map<number, player> = new Map();
	private map: PacmanMap;
	private tickRate = 1000 / 60; // 60 FPS
	private lastTime = Date.now();
	private intervalId: NodeJS.Timeout | null = null;
	private sockets: Map<number, WebSocket> = new Map();

	constructor(rawLayout: string[], initialPlayers: player[]) {
		this.map = new PacmanMap(rawLayout);
		this.addPlayer(initialPlayers);
	}

	/**
	 * Ajout d'un joueur au moteur
	 */
	public addPlayer(players: player[]): void {
		// Déterminer les personnages disponibles: Pacman et fantômes
		const characters = [CharacterType.Pacman, CharacterType.Blinky, CharacterType.Inky, CharacterType.Pinky, CharacterType.Clyde];
		const usedCharacters = new Set<string>(
			Array.from(this.players.values()).map(p => p.characterType || '')
		);

		// Filtrer les personnages disponibles
		const availableCharacters = characters.filter(c => !usedCharacters.has(c));

		players.forEach(p => {
			// Si cest le premier joueur, lui attribuer Pacman
			if (this.players.size === 0) {
				p.characterType = CharacterType.Pacman;
			} else if (!p.characterType && availableCharacters.length > 0) {
				const randomIndex = Math.floor(Math.random() * availableCharacters.length);
				p.characterType = availableCharacters.splice(randomIndex, 1)[0];
			}

			// Positionner le joueur sur un spawn selon son personnage
			const spawns = this.map.getSpawnPositions()[p.characterType || ''];
			if (spawns && spawns.length > 0) {
				const spawnIndex = this.players.size % spawns.length;
				p.position = this.gridToPixel(spawns[spawnIndex]);
				p.direction = { x: 0, y: 0 };
			}
			this.players.set(p.id, p);
		});
	}

	public changePlayerDirection(playerId: number, direction: string): void {
		const player = this.players.get(playerId);
		if (player) {
			let directionVector: vector2 | null = null;
			switch (direction) {
				case 'UP':
					directionVector = { x: 0, y: -1 };
					break;
				case 'DOWN':
					directionVector = { x: 0, y: 1 };
					break;
				case 'LEFT':
					directionVector = { x: -1, y: 0 };
					break;
				case 'RIGHT':
					directionVector = { x: 1, y: 0 };
					break;
			}
			// checker si la direction est valide et qu'il y a pas de mur
			if (directionVector) {
				// Obtenir la position actuelle sur la grille
				const currentGridPos = this.pixelToGrid(player.position);
				
				// Calculer la prochaine position sur la grille
				const nextGridPos = {
					x: currentGridPos.x + directionVector.x,
					y: currentGridPos.y + directionVector.y
				};
				
				// Vérifier si la case suivante est marchable
				const isWalkable = this.map.isWalkable(nextGridPos);
				
				if (isWalkable) {
					player.direction = directionVector;
				}
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
	 * Boucle principale de mise à jour et diffusion de l'état
	 */
	private gameLoop(): void {
		const now = Date.now();
		const delta = now - this.lastTime;
		this.lastTime = now;

		this.update(delta);
		this.broadcastState();
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

	private calculateNextPosition(player: player, direction: vector2, delta: number): vector2 {
		const speed = player.characterType === CharacterType.Pacman ? PACMAN_SPEED : GHOST_SPEED;
		return {
			x: Math.round(player.position.x + direction.x * speed * (delta / 16)),
			y: Math.round(player.position.y + direction.y * speed * (delta / 16))
		};
	}

	private debug(): void {
		console.log("=== ÉTAT ACTUEL DU JEU (DÉBOGAGE) ===");

		// Obtenir une copie de la grille
		const mapLines = this.map.toString();
		const displayMap = [...mapLines];

		// Ajouter les joueurs à la représentation
		this.players.forEach(player => {
			const gridPos = this.pixelToGrid(player.position);

			// Vérifier que la position est dans les limites
			if (gridPos.y >= 0 && gridPos.y < displayMap.length &&
				gridPos.x >= 0 && gridPos.x < displayMap[gridPos.y].length) {

				// Remplacer le caractère à la position du joueur par son symbole
				const rowChars = displayMap[gridPos.y].split('');
				rowChars[gridPos.x] = this.getPlayerSymbol(player);
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
			console.log(`${player.characterType} (ID: ${player.id}):
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
	 * Retourne un symbole pour représenter le joueur dans l'affichage de débogage
	 */
	private getPlayerSymbol(player: player): string {
		switch (player.characterType) {
			case CharacterType.Pacman: return 'P';
			case CharacterType.Blinky: return 'B';
			case CharacterType.Inky: return 'I';
			case CharacterType.Pinky: return 'Y';
			case CharacterType.Clyde: return 'C';
			default: return '@';
		}
	}

	/**
	 * Met à jour la logique de jeu
	 */
	private update(delta: number): void {
		this.players.forEach(player => {
			if (!player.direction) return;

			// Calculer la prochaine position en pixels
			const nextPos: vector2 = this.calculateNextPosition(player, player.direction, delta);

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

			// Consommation de pastilles/bonus basée sur la position de grille
			const points = this.map.consumePelletOrBonus(gridPos);
			if (points > 0) player.score += points;
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
				players: Array.from(this.players.values()).map(p => ({ id: p.id, position: p.position, score: p.score })),
				grid: this.map.toString(),
			}
		};
		this.sockets.forEach(ws => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify(state));
			}
		});
	}
}
