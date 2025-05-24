// Ghost.ts
import { player, vector2, CharacterType, TileType } from "@Pacman/TypesPacman";
import PacmanMap from "../map/Map";
import Pacman from "./Pacman";
import Character from "./Character";

export const TILE_SIZE = 50;
export const GHOST_SPEED = 2.5;

/**
 * Classe Ghost enrichie avec AI officielle (scatter + chase), et
 * qui tient compte du fait que les fantômes peuvent traverser les portails
 * en considérant directement la case de sortie du portail dans le BFS,
 * afin qu’ils n’entrent jamais réellement sur la tuile portal (évite le blocage).
 */
export default class Ghost extends Character {
	public static _speed = GHOST_SPEED;
	public static _speedRespawn = 5;

	// Référence à la map pour les collisions et pathfinding
	private map: PacmanMap;
	// Coin scatter (en coordonnées grille) pour ce fantôme
	private scatterCorner: vector2;
	// Booléen pour alterner chase/scatter
	private isScattering: boolean = false;
	// Durées (ms) en mode chase / scatter
	public isFrightened: boolean = false;
	private static SCATTER_DURATION = 7000; // 7 s scatter
	private static CHASE_DURATION = 20000;  // 20 s chase
	private lastModeSwitch = Date.now();

	// Limite de temps pour le calcul du chemin
	private lastPathCalc: number = 0;
	private static PATH_INTERVAL: number = 50;

	public isReturningToSpawn: boolean = false;

	constructor(
		player: player,
		position: vector2,
		nameChar: CharacterType,
		map: PacmanMap
	) {
		super(player, position, nameChar);
		this.map = map;
		this.scatterCorner = this.getScatterCorner();
	}

	public static get speed(): number { return this._speed; }
	public static set speed(value: number) { this._speed = value; }

	/**
	 * Retourne le coin scatter associé au type de fantôme (en coordonnées grille).
	 */
	private getScatterCorner(): vector2 {
		switch (this.nameChar) {
			case CharacterType.Blinky: // rouge → coin en haut à droite
				return { x: this.map.getWidth() - 1, y: 0 };
			case CharacterType.Pinky:  // rose → coin en haut à gauche
				return { x: 0, y: 0 };
			case CharacterType.Inky:   // cyan → coin en bas à droite
				return { x: this.map.getWidth() - 1, y: this.map.getHeight() - 1 };
			case CharacterType.Clyde:  // orange → coin en bas à gauche
				return { x: 0, y: this.map.getHeight() - 1 };
			default:
				return { x: 0, y: 0 };
		}
	}

	/**
	 * Appelée à chaque tick depuis Engine.gameLoop avant le déplacement.
	 * Détermine la case cible (scatter ou chase), puis calcule la direction immédiate.
	 * @param pacman Référence à l’objet Pac-Man
	 * @param allGhosts Ensemble des fantômes (utile pour Inky)
	 */
	public updateBehaviour(pacman: Pacman, allGhosts: Map<number, Ghost>): void {

		// Si en mode retour vers spawn
		if (this.isReturningToSpawn && this.spawnTarget) {
			const currentGrid = this.pixelToGrid(this.position);

			// Si arrivé à destination
			console.log(`[Ghost ${this.nameChar}] retour vers spawn: ${this.position.x},${this.position.y} / ${this.spawnTarget.x},${this.spawnTarget.y}`);
			if (this.position.x - this.spawnTarget.x <= 2 && this.position.y - this.spawnTarget.y <= 2) {
				this.isReturningToSpawn = false;
				this.direction = { x: 0, y: 0 };
				this.nextDirection = { x: 0, y: 0 };
				return;
			}

			// Sinon, calculer direction vers spawn
			const nextDir = this.computeNextDirectionBFS(currentGrid, this.pixelToGrid(this.spawnTarget));
			if (nextDir) {
				this.nextDirection = nextDir;
			}
			return;
		}

		// Si en mode frightened, on utilise une logique de fuite
		if (this.isFrightened) return this.updateFrightenedBehaviour(pacman);

		// Limiter la fréquence de recalcul (pour perf), max un calcul tous les 200 ms
		const now = Date.now();
		if (now - this.lastPathCalc < Ghost.PATH_INTERVAL) {
			return;
		}
		this.lastPathCalc = now;

		// 1) Alterne scatter <-> chase selon le timer
		// const elapsed = now - this.lastModeSwitch;
		// if (!this.isScattering && elapsed >= Ghost.CHASE_DURATION) {
		// 	this.isScattering = true;
		// 	this.lastModeSwitch = now;
		// } else if (this.isScattering && elapsed >= Ghost.SCATTER_DURATION) {
		this.isScattering = false;
		this.lastModeSwitch = now;
		// }

		// 2) Calcule la case cible (en grille)
		const currentGrid = this.pixelToGrid(this.position);
		let targetGrid: vector2;
		if (this.isScattering) {
			targetGrid = this.scatterCorner;
		} else {
			switch (this.nameChar) {
				case CharacterType.Blinky:
					targetGrid = this.getBlinkyTarget(pacman);
					break;
				case CharacterType.Pinky:
					targetGrid = this.getPinkyTarget(pacman);
					break;
				case CharacterType.Inky:
					targetGrid = this.getInkyTarget(pacman, allGhosts);
					break;
				case CharacterType.Clyde:
					targetGrid = this.getClydeTarget(pacman, currentGrid);
					break;
				default:
					targetGrid = this.pixelToGrid(pacman.position);
			}
		}

		// 3) BFS en tenant compte des portails : si une case voisine est un portail,
		//    on considère directement sa case de sortie (en grille) comme voisin.
		const nextDir = this.computeNextDirectionBFS(currentGrid, targetGrid);
		if (nextDir) {
			this.nextDirection = nextDir;
		}
	}

	/**
	 * Comportement en mode frightened: fuir Pac-Man
	 */
	private updateFrightenedBehaviour(pacman: Pacman): void {
		const currentGrid = this.pixelToGrid(this.position);
		const pacmanGrid = this.pixelToGrid(pacman.position);

		// Pour fuir, on choisit une direction aléatoire qui ne rapproche pas de Pac-Man
		// ou on vise le point opposé à Pac-Man sur la carte
		const targetGrid: vector2 = {
			x: 2 * currentGrid.x - pacmanGrid.x,
			y: 2 * currentGrid.y - pacmanGrid.y
		};

		// Limiter les coordonnées aux dimensions de la carte
		targetGrid.x = Math.max(0, Math.min(this.map.getWidth() - 1, targetGrid.x));
		targetGrid.y = Math.max(0, Math.min(this.map.getHeight() - 1, targetGrid.y));

		// Calculer la prochaine direction avec BFS
		const nextDir = this.computeNextDirectionBFS(currentGrid, targetGrid);
		if (nextDir) {
			this.nextDirection = nextDir;
		}
	}

	/** (Blinky) cible la position actuelle de Pac-Man. */
	private getBlinkyTarget(pacman: Pacman): vector2 {
		return this.pixelToGrid(pacman.position);
	}

	/**
	 * (Pinky) cible 4 cases devant Pac-Man selon sa direction.
	 * Bug historique : si Pac-Man regarde vers le haut, on décale encore de 2 cases.
	 */
	private getPinkyTarget(pacman: Pacman): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dir = pacman.direction || { x: 0, y: 0 };
		let tx = pacGrid.x + dir.x * 4;
		let ty = pacGrid.y + dir.y * 4;
		if (dir.y === -1 && dir.x === 0) {
			ty -= 2;
		}
		tx = Math.max(0, Math.min(this.map.getWidth() - 1, tx));
		ty = Math.max(0, Math.min(this.map.getHeight() - 1, ty));
		return { x: tx, y: ty };
	}

	/**
	 * (Inky) construit un vecteur entre Blinky et le point deux cases devant Pac-Man,
	 * puis double ce vecteur.
	 */
	private getInkyTarget(pacman: Pacman, allGhosts: Map<number, Ghost>): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dir = pacman.direction || { x: 0, y: 0 };
		const interX = pacGrid.x + dir.x * 2;
		const interY = pacGrid.y + dir.y * 2;

		let blinkyGrid: vector2 = { x: 0, y: 0 };
		for (const ghost of allGhosts.values()) {
			if (ghost.nameChar === CharacterType.Blinky) {
				blinkyGrid = this.pixelToGrid(ghost.position);
				break;
			}
		}

		const vx = interX - blinkyGrid.x;
		const vy = interY - blinkyGrid.y;
		let tx = blinkyGrid.x + vx * 2;
		let ty = blinkyGrid.y + vy * 2;
		tx = Math.max(0, Math.min(this.map.getWidth() - 1, tx));
		ty = Math.max(0, Math.min(this.map.getHeight() - 1, ty));
		return { x: tx, y: ty };
	}

	/**
	 * (Clyde) poursuit Pac-Man s’il est à plus de 8 cases, sinon retourne en scatter.
	 */
	private getClydeTarget(pacman: Pacman, currentGrid: vector2): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dx = currentGrid.x - pacGrid.x;
		const dy = currentGrid.y - pacGrid.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		return dist > 8 ? this.getBlinkyTarget(pacman) : this.scatterCorner;
	}

	/**
	 * BFS pour trouver la direction immédiate vers targetGrid.
	 * Si une case voisine est un portail, on remplace (nx,ny) par la case de sortie du portail (en grille).
	 */
	private computeNextDirectionBFS(
		startGrid: vector2,
		targetGrid: vector2
	): vector2 | null {
		// Si on est déjà sur la cible, on reste en place
		if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) {
			return { x: 0, y: 0 };
		}

		const width = this.map.getWidth();
		const height = this.map.getHeight();
		const visited: boolean[][] = Array.from({ length: height }, () =>
			Array(width).fill(false)
		);
		const prev: (vector2 | null)[][] = Array.from({ length: height }, () =>
			Array(width).fill(null)
		);

		const queue: vector2[] = [];
		visited[startGrid.y][startGrid.x] = true;
		queue.push({ x: startGrid.x, y: startGrid.y });

		// Directions orthogonales (haut, gauche, bas, droite)
		const dirs: vector2[] = [
			{ x: 0, y: -1 },
			{ x: -1, y: 0 },
			{ x: 0, y: 1 },
			{ x: 1, y: 0 },
		];

		let found = false;

		while (queue.length > 0 && !found) {
			const curr = queue.shift()!;

			for (const d of dirs) {
				let nx = curr.x + d.x;
				let ny = curr.y + d.y;

				// Hors de la grille ?
				if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
				if (visited[ny][nx]) continue;

				// Si mur, on skip
				if (!this.map.isWalkable(this.nameChar, { x: nx, y: ny })) {
					continue;
				}

				if (!visited[ny][nx]) {
					visited[ny][nx] = true;
					prev[ny][nx] = { x: curr.x, y: curr.y };

					if (nx === targetGrid.x && ny === targetGrid.y) {
						found = true;
						break;
					}
					queue.push({ x: nx, y: ny });
				}
			}
		}

		if (!found) {
			// console.warn(`[Ghost ${this.nameChar}] impossible de trouver un chemin de ${startGrid.x},${startGrid.y} vers ${targetGrid.x},${targetGrid.y}`);
			return null;
		}

		// Reconstituer le chemin depuis target jusqu'à start
		let step: vector2 = { x: targetGrid.x, y: targetGrid.y };
		while (true) {
			const p = prev[step.y][step.x];
			if (!p) break;
			if (p.x === startGrid.x && p.y === startGrid.y) {
				break;
			}
			step = { x: p.x, y: p.y };
		}

		return {
			x: step.x - startGrid.x,
			y: step.y - startGrid.y,
		};
	}

	public respawn(): void {
		this.isFrightened = false;
		this.isReturningToSpawn = true;
	}
}
