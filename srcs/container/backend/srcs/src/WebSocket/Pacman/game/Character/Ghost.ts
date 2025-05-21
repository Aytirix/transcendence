// Ghost.ts
import { player, vector2, CharacterType } from "@Pacman/TypesPacman";
import PacmanMap from "../map/Map";
import Pacman from "./Pacman";
import Character from "./Character";
import { TILE_SIZE } from "../Engine";

/**
 * Classe Ghost enrichie avec AI officielle (scatter + chase).
 */
export default class Ghost extends Character {
	private static _speed = 2;

	// Référence à la map pour les collisions et pathfinding
	private map: PacmanMap;
	// Coin scatter (en coordonnées grille) pour ce fantôme
	private scatterCorner: vector2;
	// Booleen pour alterner chase/scatter
	private isScattering: boolean = false;
	// Durées (ms) en mode chase / scatter (vous pouvez ajuster pour caler au plus proche de l’original)
	private static SCATTER_DURATION = 7000; // 7 secondes scatter
	private static CHASE_DURATION = 20000; // 20 secondes chase
	private modeTimer = 0;  // Compteur interne
	private modeToggleAt = Ghost.SCATTER_DURATION; // moment du prochain changement de mode
	private lastModeSwitch = Date.now();

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
			case CharacterType.Blinky: // rouge → en haut à droite
				return { x: this.map.width - 1, y: 0 };
			case CharacterType.Pinky:  // rose → en haut à gauche
				return { x: 0, y: 0 };
			case CharacterType.Inky:   // cyan → en bas à droite
				return { x: this.map.width - 1, y: this.map.height - 1 };
			case CharacterType.Clyde:  // orange → en bas à gauche
				return { x: 0, y: this.map.height - 1 };
			default:
				return { x: 0, y: 0 };
		}
	}

	/**
	 * Appelée à chaque tick depuis Engine.gameLoop avant de calculer la nouvelle position.
	 * Détermine la case cible selon chase / scatter, puis définit nextDirection.
	 * @param pacman Référence à l’objet Pacman (pour obtenir sa position & direction)
	 * @param allGhosts Map de tous les fantômes (nécessaire pour Inky qui a besoin de Blinky)
	 */
	public updateBehaviour(pacman: Pacman, allGhosts: Map<number, Ghost>): void {
		// 1) Mettre à jour le timer et éventuellement basculer mode scatter <-> chase
		const now = Date.now();
		const elapsedSinceSwitch = now - this.lastModeSwitch;
		if (!this.isScattering && elapsedSinceSwitch >= Ghost.CHASE_DURATION) {
			this.isScattering = true;
			this.lastModeSwitch = now;
		} else if (this.isScattering && elapsedSinceSwitch >= Ghost.SCATTER_DURATION) {
			this.isScattering = false;
			this.lastModeSwitch = now;
		}

		// 2) Calcul de la case-cible (en coordonnées grille)
		const currentGrid: vector2 = this.pixelToGrid(this.position);
		let targetGrid: vector2;
		if (this.isScattering) {
			targetGrid = this.scatterCorner;
		} else {
			// Mode chase : comportement selon le type
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
					targetGrid = pacman ? this.pixelToGrid(pacman.position) : currentGrid;
			}
		}

		// 3) Cheminement minimal pour trouver la direction immédiate (nextDirection)
		const nextDir = this.computeNextDirectionBFS(currentGrid, targetGrid);
		if (nextDir) {
			this.nextDirection = nextDir;
		}
	}

	/**
	 * (Blinky) cible directement la position actuelle de Pac-Man (en grille).
	 */
	private getBlinkyTarget(pacman: Pacman): vector2 {
		return this.pixelToGrid(pacman.position);
	}

	/**
	 * (Pinky) cible 4 cases devant Pac-Man selon sa direction.
	 * ATTENTION : bug historique → quand Pac-Man regarde vers le haut, Pinky cible en réalité y-4 - 2 cases.
	 */
	private getPinkyTarget(pacman: Pacman): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dir = pacman.direction || { x: 0, y: 0 };
		let targetX = pacGrid.x + dir.x * 4;
		let targetY = pacGrid.y + dir.y * 4;
		// Bug « minus one » pour le haut : si dir.y = -1, on décale encore de 2 cases vers le haut
		if (dir.y === -1 && dir.x === 0) {
			targetY -= 2;
		}
		// On clamp pour rester dans la grille
		targetX = Math.max(0, Math.min(this.map.width - 1, targetX));
		targetY = Math.max(0, Math.min(this.map.height - 1, targetY));
		return { x: targetX, y: targetY };
	}

	/**
	 * (Inky) construit un vecteur entre Blinky et le point à deux cases devant Pac-Man.
	 * Pour trouver Blinky, on recherche le fantôme dont nameChar = Blinky dans allGhosts.
	 */
	private getInkyTarget(pacman: Pacman, allGhosts: Map<number, Ghost>): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dir = pacman.direction || { x: 0, y: 0 };
		// 1) Point deux cases devant Pac-Man
		const intermediateX = pacGrid.x + dir.x * 2;
		const intermediateY = pacGrid.y + dir.y * 2;
		// 2) Trouver Blinky
		let blinkyGrid: vector2 = { x: 0, y: 0 };
		for (const ghost of allGhosts.values()) {
			if (ghost.nameChar === CharacterType.Blinky) {
				blinkyGrid = this.pixelToGrid(ghost.position);
				break;
			}
		}
		// 3) Construire le vecteur (Blinky → intermediate), puis doubler
		const vectX = intermediateX - blinkyGrid.x;
		const vectY = intermediateY - blinkyGrid.y;
		let targetX = blinkyGrid.x + vectX * 2;
		let targetY = blinkyGrid.y + vectY * 2;
		// On clamp pour rester dans la grille
		targetX = Math.max(0, Math.min(this.map.width - 1, targetX));
		targetY = Math.max(0, Math.min(this.map.height - 1, targetY));
		return { x: targetX, y: targetY };
	}

	/**
	 * (Clyde) si distance à Pac-Man > 8, se comporte comme Blinky ; sinon, revient vers son coin scatter.
	 */
	private getClydeTarget(pacman: Pacman, currentGrid: vector2): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dx = currentGrid.x - pacGrid.x;
		const dy = currentGrid.y - pacGrid.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (distance > 8) {
			return this.getBlinkyTarget(pacman); // poursuit Pac-Man
		} else {
			return this.scatterCorner; // retourne à son coin
		}
	}

	/**
	 * Recherche de chemin minimal (BFS) pour déterminer la direction immédiate qui rapproche vers targetGrid.
	 * Retourne un vector2 {x: -1|0|1, y: -1|0|1} indiquant la direction à prendre.
	 */
	private computeNextDirectionBFS(
		startGrid: vector2,
		targetGrid: vector2
	): vector2 | null {
		// Si on est déjà à la cible, on ne bouge pas.
		if (startGrid.x === targetGrid.x && startGrid.y === targetGrid.y) {
			return { x: 0, y: 0 };
		}
		const width = this.map.width;
		const height = this.map.height;
		const visited: boolean[][] = Array.from({ length: height }, () =>
			Array(width).fill(false)
		);
		// Stocke pour chaque case la coordonnée de la case précédente (pour retracer le chemin)
		const prev: (vector2 | null)[][] = Array.from({ length: height }, () =>
			Array(width).fill(null)
		);

		const queue: vector2[] = [];
		queue.push({ x: startGrid.x, y: startGrid.y });
		visited[startGrid.y][startGrid.x] = true;

		const directions: vector2[] = [
			{ x: 0, y: -1 }, // haut
			{ x: 0, y: 1 },  // bas
			{ x: -1, y: 0 }, // gauche
			{ x: 1, y: 0 },  // droite
		];

		let found = false;
		while (queue.length > 0 && !found) {
			const curr = queue.shift()!;
			for (const d of directions) {
				const nx = curr.x + d.x;
				const ny = curr.y + d.y;
				if (
					nx >= 0 &&
					nx < width &&
					ny >= 0 &&
					ny < height &&
					!visited[ny][nx] &&
					this.map.isWalkable(this.nameChar, { x: nx, y: ny })
				) {
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

		// Si la cible n’a pas été atteinte (path impossible), on ne change pas de direction
		if (!found) {
			return null;
		}

		// Sinon, on reconstruit le chemin arrière depuis target jusqu’à start
		let step = { x: targetGrid.x, y: targetGrid.y };
		while (
			prev[step.y][step.x] != null &&
			!(prev[step.y][step.x]!.x === startGrid.x && prev[step.y][step.x]!.y === startGrid.y)
		) {
			step = prev[step.y][step.x]!;
		}
		// À ce stade, `step` est la première case atteinte en partant de start vers target
		const dirX = step.x - startGrid.x;
		const dirY = step.y - startGrid.y;
		return { x: dirX, y: dirY };
	}

	/**
	 * Convertit une position pixel (centre du sprite) en coordonnées grille (tuile).
	 */
	private pixelToGrid(pixelPos: vector2): vector2 {
		return {
			x: Math.floor(pixelPos.x / TILE_SIZE),
			y: Math.floor(pixelPos.y / TILE_SIZE),
		};
	}
}
