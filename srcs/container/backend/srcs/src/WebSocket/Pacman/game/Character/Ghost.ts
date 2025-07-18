import { player, vector2, CharacterType, TileType } from "@Pacman/TypesPacman";
import PacmanMap from "../map/Map";
import Pacman from "./Pacman";
import Character from "./Character";

export const TILE_SIZE = 50;
export const GHOST_SPEED = 3.5;

/**
 * Classe Ghost enrichie avec AI Chase permanente (sans scatter),
 * utilisant BFS pour obtenir le chemin le plus court vers la cible.
 */
export default class Ghost extends Character {
	public static _speed = GHOST_SPEED;
	public static _speedRespawn = 8;

	// Référence à la map pour les collisions et pathfinding
	private map: PacmanMap;

	// Durée minimale entre recalcul de direction
	private lastDirectionCalc: number = 0;
	private static DIRECTION_INTERVAL: number = 50; // Réduit pour plus de réactivité

	public isFrightened: boolean = false;
	public isReturningToSpawn: boolean = false;

	constructor(
		player: player,
		position: vector2,
		nameChar: CharacterType,
		map: PacmanMap
	) {
		super(player, position, map.respawnGhostPos, nameChar);
		this.map = map;
		// Donner une direction initiale neutre pour déclencher update
		this.direction = { x: 0, y: 0 };
		this.nextDirection = { x: 0, y: 0 };
	}

	public static get speed(): number { return this._speed; }
	public static set speed(value: number) { this._speed = value; }

	/**
	 * Appelée à chaque tick depuis Engine.gameLoop avant le déplacement.
	 * Détermine la case cible (chase permanent), puis utilise BFS pour calculer
	 * la direction immédiate vers la cible.
	 * @param pacman Référence à l’objet Pac-Man
	 * @param allGhosts Ensemble des fantômes (utile pour Inky)
	 */
	public updateBehaviour(pacman: Pacman, allGhosts: Map<number, Ghost>): void {
		const currentGrid = this.pixelToGrid(this.position);

		// 1) Si le fantôme est encore sur sa position de spawn (dans la maison), forcer une sortie vers le haut
		if (this.spawnTarget) {
			const spawnGrid = this.pixelToGrid(this.spawnTarget);
			if (!this.isReturningToSpawn &&
				currentGrid.x === spawnGrid.x &&
				currentGrid.y === spawnGrid.y) {
				// Tenter de sortir vers le haut si possible
				const upGrid = { x: currentGrid.x, y: currentGrid.y - 1 };
				if (
					upGrid.y >= 0 &&
					this.map.isWalkable(this.nameChar, upGrid)
				) {
					this.nextDirection = { x: 0, y: -1 };
					return;
				}
			}
		}

		// 2) Si en mode retour vers spawn
		if (this.isReturningToSpawn && this.spawnTarget) {
			// Recalculer currentGrid ici (au cas où la position a changé)
			const grid = this.pixelToGrid(this.position);
			// Si arrivé à destination (seuil de 2 pixels)
			if (
				Math.abs(this.position.x - this.spawnTarget.x) <= 2 &&
				Math.abs(this.position.y - this.spawnTarget.y) <= 2
			) {

				setTimeout(() => {
					this.isReturningToSpawn = false;
				}, 4000);
				return;
			}

			// Sinon, calculer direction vers spawn via BFS
			const nextDir = this.computeNextDirectionBFS(
				grid,
				this.pixelToGrid(this.spawnTarget)
			);
			if (nextDir) {
				this.nextDirection = nextDir;
			}
			return;
		}

		// 3) Si en mode frightened, on utilise BFS pour fuir ou autre logique
		if (this.isFrightened) {
			return this.updateFrightenedBehaviour(pacman);
		}

		// 4) Limiter la fréquence de recalcul (performances) - mais permettre plus de réactivité si bloqué
		const now = Date.now();
		const isStuck = this.direction.x === 0 && this.direction.y === 0;
		if (!isStuck && now - this.lastDirectionCalc < Ghost.DIRECTION_INTERVAL) {
			return;
		}
		this.lastDirectionCalc = now;

		// 5) Calcul de la cible selon le type de fantôme (mode Chase permanent)
		let targetGrid: vector2;
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

		// 6) Utiliser BFS pour calculer la direction menant au chemin le plus court
		let nextDir = this.computeNextDirectionBFS(currentGrid, targetGrid);
        if (!nextDir) {
            // Si aucune direction trouvée, choisir une direction aléatoire non bloquée (pas de demi-tour sauf si bloqué)
            nextDir = this.findAlternativeDirection(currentGrid);
        }
        this.nextDirection = nextDir;
        
        // Sécurité anti-blocage : si le fantôme est bloqué, on force une direction possible
        if (this.direction.x === 0 && this.direction.y === 0 && this.nextDirection.x === 0 && this.nextDirection.y === 0) {
            console.warn(`Fantôme ${this.nameChar} complètement bloqué, tentative de déblocage`);
            this.forceUnblock();
        }
	}

	/**
	 * Comportement en mode frightened: fuir Pac-Man en utilisant BFS classique.
	 */
	private updateFrightenedBehaviour(pacman: Pacman): void {
        const currentGrid = this.pixelToGrid(this.position);
        const pacmanGrid = this.pixelToGrid(pacman.position);

        // Pour fuir, on choisit un point opposé à Pac-Man
        const targetGrid: vector2 = {
            x: 2 * currentGrid.x - pacmanGrid.x,
            y: 2 * currentGrid.y - pacmanGrid.y
        };

        // Limiter les coordonnées aux dimensions de la carte
        targetGrid.x = Math.max(0, Math.min(this.map.getWidth() - 1, targetGrid.x));
        targetGrid.y = Math.max(0, Math.min(this.map.getHeight() - 1, targetGrid.y));

        // Calculer la prochaine direction avec BFS
        let nextDir = this.computeNextDirectionBFS(currentGrid, targetGrid);
        if (!nextDir) {
            // Si aucune direction trouvée, utiliser la méthode alternative
            nextDir = this.findAlternativeDirection(currentGrid);
        }
        this.nextDirection = nextDir;
    }

	/** (Blinky) cible la position actuelle de Pac-Man. */
	private getBlinkyTarget(pacman: Pacman): vector2 {
		return this.pixelToGrid(pacman.position);
	}

	/**
	 * (Pinky) cible 4 cases devant Pac-Man selon sa direction (sans bug historique). */
	private getPinkyTarget(pacman: Pacman): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dir = pacman.direction || { x: 0, y: 0 };
		let tx = pacGrid.x + dir.x * 4;
		let ty = pacGrid.y + dir.y * 4;
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
	 * (Clyde) poursuit Pac-Man s’il est à plus de 8 cases, sinon vise son coin.
	 */
	private getClydeTarget(pacman: Pacman, currentGrid: vector2): vector2 {
		const pacGrid = this.pixelToGrid(pacman.position);
		const dx = currentGrid.x - pacGrid.x;
		const dy = currentGrid.y - pacGrid.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > 8) {
			return this.getBlinkyTarget(pacman);
		}
		// Coin scatter fixé (coin bas gauche)
		return { x: 0, y: this.map.getHeight() - 1 };
	}

	/**
	 * BFS pour trouver la direction immédiate vers targetGrid.
	 * Renvoie le vecteur (dx, dy) d'une tuile à partir de la position actuelle.
	 */
	private computeNextDirectionBFS(
		startGrid: vector2,
		targetGrid: vector2
	): vector2 | null {
		// Si déjà sur la cible
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

		// Déterminer toutes les directions possibles
		const dirs: vector2[] = [
			{ x: 0, y: -1 },
			{ x: -1, y: 0 },
			{ x: 0, y: 1 },
			{ x: 1, y: 0 },
		];

		// Définir la direction opposée (demi-tour) à éviter
		const oppositeDir = {
			x: -this.direction.x,
			y: -this.direction.y
		};

		// Vérifier si la direction actuelle est bloquée par un mur
		const forwardX = startGrid.x + this.direction.x;
		const forwardY = startGrid.y + this.direction.y;
		const isForwardBlocked = forwardX < 0 || forwardX >= width || forwardY < 0 || forwardY >= height ||
			!this.map.isWalkable(this.nameChar, { x: forwardX, y: forwardY });

		// Filtrer les directions possibles selon la règle : demi-tour uniquement si direction actuelle bloquée
		const validInitialDirs = dirs.filter(dir => {
			const nx = startGrid.x + dir.x;
			const ny = startGrid.y + dir.y;

			// Vérifier si c'est dans les limites et walkable
			if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
			if (!this.map.isWalkable(this.nameChar, { x: nx, y: ny })) return false;

			// Si c'est un demi-tour, ne l'autoriser que si la direction actuelle est bloquée
			if (dir.x === oppositeDir.x && dir.y === oppositeDir.y) {
				return isForwardBlocked;
			}

			return true;
		});

		// Si aucune direction valide, retourner null
		if (validInitialDirs.length === 0) {
			return null;
		}

		const queue: vector2[] = [];
		visited[startGrid.y][startGrid.x] = true;
		queue.push({ x: startGrid.x, y: startGrid.y });

		let found = false;

		while (queue.length > 0 && !found) {
			const curr = queue.shift()!;

			// Pour les positions autres que la position initiale, explorer toutes les directions
			for (const d of dirs) {
				let nx = curr.x + d.x;
				let ny = curr.y + d.y;

				// Si nous sommes à la position initiale, appliquer la même logique de filtrage
				if (curr.x === startGrid.x && curr.y === startGrid.y) {
					// Ne pas autoriser le demi-tour sauf si la direction actuelle est bloquée
					if (d.x === oppositeDir.x && d.y === oppositeDir.y && !isForwardBlocked) {
						continue;
					}
				}

				if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
				if (visited[ny][nx]) continue;
				if (!this.map.isWalkable(this.nameChar, { x: nx, y: ny })) continue;

				visited[ny][nx] = true;
				prev[ny][nx] = { x: curr.x, y: curr.y };

				if (nx === targetGrid.x && ny === targetGrid.y) {
					found = true;
					break;
				}
				queue.push({ x: nx, y: ny });
			}
		}

		// Si le chemin n'a pas été trouvé, choisir aléatoirement parmi les directions valides
		if (!found) {
			const randomIndex = Math.floor(Math.random() * validInitialDirs.length);
			return validInitialDirs[randomIndex];
		}

		// Reconstituer le chemin en remontant depuis la cible
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

	/**
	 * Force le déblocage du fantôme si toutes les conditions normales échouent
	 */
	private forceUnblock(): void {
		const currentGrid = this.pixelToGrid(this.position);
		const dirs: vector2[] = [
			{ x: 0, y: -1 }, // Haut
			{ x: 1, y: 0 },  // Droite  
			{ x: 0, y: 1 },  // Bas
			{ x: -1, y: 0 }  // Gauche
		];
		
		// Essayer toutes les directions possibles, y compris le demi-tour
		for (const dir of dirs) {
			const testPos = {
				x: currentGrid.x + dir.x,
				y: currentGrid.y + dir.y
			};
			if (this.map.isWalkable(this.nameChar, testPos)) {
				this.direction = { ...dir };
				this.nextDirection = { ...dir };
				console.log(`Fantôme ${this.nameChar} débloqué vers direction [${dir.x}, ${dir.y}]`);
				return;
			}
		}
		
		// Si vraiment aucune direction n'est possible, réinitialiser à la position de spawn
		console.warn(`Fantôme ${this.nameChar} complètement bloqué, retour au spawn`);
		this.respawn();
	}

	/**
	 * Trouve une direction alternative en évitant le demi-tour sauf si c'est la seule option
	 */
	private findAlternativeDirection(currentGrid: vector2): vector2 {
		const dirs: vector2[] = [
			{ x: 0, y: -1 }, // Haut
			{ x: 1, y: 0 },  // Droite  
			{ x: 0, y: 1 },  // Bas
			{ x: -1, y: 0 }  // Gauche
		];

		// Direction opposée (demi-tour)
		const oppositeDir = {
			x: -this.direction.x,
			y: -this.direction.y
		};

		// Vérifier si la direction actuelle est bloquée par un mur
		const forwardGrid = {
			x: currentGrid.x + this.direction.x,
			y: currentGrid.y + this.direction.y
		};
		const isForwardBlocked = !this.map.isWalkable(this.nameChar, forwardGrid);

		// Filtrer les directions possibles
		const validDirs = dirs.filter(dir => {
			const nx = currentGrid.x + dir.x;
			const ny = currentGrid.y + dir.y;
			
			// Vérifier si c'est dans les limites et walkable
			if (!this.map.isWalkable(this.nameChar, { x: nx, y: ny })) {
				return false;
			}

			// Si c'est un demi-tour, ne l'autoriser que si la direction actuelle est bloquée
			if (dir.x === oppositeDir.x && dir.y === oppositeDir.y) {
				return isForwardBlocked;
			}

			return true;
		});

		// Retourner une direction aléatoire parmi les valides
		if (validDirs.length > 0) {
			return validDirs[Math.floor(Math.random() * validDirs.length)];
		}

		// Si aucune direction n'est possible, retourner une direction nulle
		return { x: 0, y: 0 };
	}

	/**
	 * Inverse la direction actuelle du fantôme (utilisé lors du mode frightened)
	 */
	public reverseDirection(): void {
		this.direction = {
			x: -this.direction.x,
			y: -this.direction.y
		};
		this.nextDirection = { ...this.direction };
	}
}
