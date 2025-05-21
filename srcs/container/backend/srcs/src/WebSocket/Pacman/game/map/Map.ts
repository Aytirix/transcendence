import { player, room, GameState, vector2, TileType, CharacterType } from "@Pacman/TypesPacman";
import Pacman from "../Character/Pacman";


export default class PacmanMap {
	private grid: TileType[][];
	/**
	 * Map des téléporteurs : position source -> position destination
	 */
	private teleportMap: Map<string, vector2> = new Map();

	public constructor(grid: string[]) {
		this.grid = this.fromNumbers(grid);
		this.buildTeleportMap();
	}

	/**
	 * Transforme une carte de type string[] en TileType[][]
	 */
	public fromNumbers(gridDict: string[]): TileType[][] {
		const grid = gridDict.map(line => {
			return line.split('').map(char => {
				switch (char) {
					case TileType.Wall:
						return TileType.Wall;
					case TileType.Pellet:
						return TileType.Pellet;
					case TileType.Bonus:
						return TileType.Bonus;
					case TileType.Empty:
						return TileType.Empty;
					case TileType.GhostPortalBlock:
						return TileType.GhostPortalBlock;
					case TileType.SpawnPacman:
						return TileType.SpawnPacman;
					case TileType.SpawnBlinky:
						return TileType.SpawnBlinky;
					case TileType.SpawnInky:
						return TileType.SpawnInky;
					case TileType.SpawnPinky:
						return TileType.SpawnPinky;
					case TileType.SpawnClyde:
						return TileType.SpawnClyde;
					case TileType.Teleport:
						return TileType.Teleport;
					default:
						throw new Error(`Unknown tile type: ${char}`);
				}
			});
		});
		return grid;
	}

	/**
	 * Récupère le type de tuile à la position donnée
	 */
	public getTile(pos: vector2): TileType | null {
		if (pos.y < 0 || pos.y >= this.grid.length) return null;
		if (pos.x < 0 || pos.x >= this.grid[0].length) return null;
		return this.grid[pos.y][pos.x];
	}

	/**
	 * Teste si on peut marcher sur la tuile (inutile sur les murs et fantom-portal)
	 */
	public isWalkable(pos: vector2): boolean {
		const tile = this.getTile(pos);
		return tile !== null && tile !== TileType.Wall && tile !== TileType.GhostPortalBlock;
	}

	/**
	 * Construit automatiquement la map des téléporteurs (pairs horizontaux ou verticaux)
	 */
	private buildTeleportMap(): void {
		const h = this.grid.length;
		const w = this.grid[0].length;
		const teleports: vector2[] = [];

		// Collecte toutes les tuiles Teleport
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				if (this.grid[y][x] === TileType.Teleport) {
					teleports.push({ x, y });
				}
			}
		}

		// On suppose que les paires sont alignées horizontalement ou verticalement
		teleports.forEach(src => {
			const pair = teleports.find(dest => {
				if (dest.x === src.x && Math.abs(dest.y - src.y) > 0) return true;
				if (dest.y === src.y && Math.abs(dest.x - src.x) > 0) return true;
				return false;
			});
			if (pair) {
				this.teleportMap.set(`${src.x},${src.y}`, pair);
			}
		});
	}

	/**
	 * Consomme une pastille ou un bonus à la position donnée et retourne les points gagnés
	 * Retourne 0 si aucune pastille ou bonus n'est présent
	 */
	public consumePelletOrBonus(player: Pacman, pos: vector2): void {
		const tile = this.getTile(pos);

		if (tile === TileType.Pellet) {
			this.setTile(pos, TileType.Empty);
			player.score += 10;
		} else if (tile === TileType.Bonus) {
			this.setTile(pos, TileType.Empty);
			player.score += 50;
		}
	}

	/**
	 * Vérifie s'il y a une collision entre deux positions
	 * Utilisé pour détecter les collisions entre Pac-Man et les fantômes
	 */
	public detectCollision(pos1: vector2, pos2: vector2): boolean {
		// Deux entités sont en collision si elles occupent la même position
		return pos1.x === pos2.x && pos1.y === pos2.y;
	}

	/**
	 * Vérifie s'il y a une collision entre une entité et un groupe d'entités
	 * @param entityPos vector2 de l'entité à vérifier (généralement Pac-Man)
	 * @param otherPositions Liste des positions des autres entités (généralement les fantômes)
	 * @returns La position de la première entité en collision ou null s'il n'y a pas de collision
	 */
	public detectCollisionWithGroup(entityPos: vector2, otherPositions: vector2[]): vector2[] {
		let collision = [];
		for (const otherPos of otherPositions) {
			if (this.detectCollision(entityPos, otherPos)) {
				collision.push(otherPos);
			}
		}
		return collision;
	}

	/**
	 * Compte le nombre total de pastilles restantes sur la carte
	 */
	public countRemainingPellets(): number {
		let count = 0;
		for (let y = 0; y < this.getHeight(); y++) {
			for (let x = 0; x < this.getWidth(); x++) {
				const tile = this.grid[y][x];
				if (tile === TileType.Pellet || tile === TileType.Bonus) {
					count++;
				}
			}
		}
		return count;
	}

	/**
	 * Si la position est un téléporteur, retourne la destination
	 */
	public getTeleportDestination(direction: vector2, pos: vector2): vector2 | null {
		const key = `${pos.x},${pos.y}`;
		let tp = this.teleportMap.get(key) || null;
		if (!tp) return null;
		// if (direction.x <= 0) tp = { x: tp.x - 1, y: tp.y };
		// if (direction.x >= 0) tp = { x: tp.x + 1, y: tp.y };
		// if (direction.y <= 0) tp = { x: tp.x, y: tp.y - 1 };
		// if (direction.y >= 0) tp = { x: tp.x, y: tp.y + 1 };
		return tp;
	}

	/**
	 * Renvoie les positions voisines (haut, bas, gauche, droite)
	 */
	public getNeighbors(pos: vector2): vector2[] {
		const shifts: vector2[] = [
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 },
		];
		return shifts
			.map(s => ({ x: pos.x + s.x, y: pos.y + s.y }))
			.filter(p => this.isWalkable(p));
	}

	/**
	 * Retourne toutes les positions de spawn par type
	 */
	public getSpawnPositions(): Record<string, vector2[]> {
		const spawns: Record<string, vector2[]> = {};
		for (let y = 0; y < this.grid.length; y++) {
			for (let x = 0; x < this.grid[0].length; x++) {
				const tile = this.grid[y][x];
				switch (tile) {
					case TileType.SpawnPacman:
						spawns.P = spawns.P || [];
						spawns.P.push({ x, y });
						break;
					case TileType.SpawnBlinky:
						spawns.B = spawns.B || [];
						spawns.B.push({ x, y });
						break;
					case TileType.SpawnInky:
						spawns.I = spawns.I || [];
						spawns.I.push({ x, y });
						break;
					case TileType.SpawnPinky:
						spawns.Y = spawns.Y || [];
						spawns.Y.push({ x, y });
						break;
					case TileType.SpawnClyde:
						spawns.C = spawns.C || [];
						spawns.C.push({ x, y });
						break;
					default:
						break;
				}
			}
		}
		return spawns;
	}

	/**
	 * Remplace une tuile (utile pour ramasser une pastille ou bonus)
	 */
	public setTile(pos: vector2, tile: TileType): void {
		if (pos.y < 0 || pos.y >= this.grid.length) return;
		if (pos.x < 0 || pos.x >= this.grid[0].length) return;
		this.grid[pos.y][pos.x] = tile;
	}


	/**
	 * Convertit la grille en chaîne de caractères pour affichage
	 */
	public toString(): string[] {
		let result: string[] = [];
		for (let y = 0; y < this.grid.length; y++) {
			let row = '';
			for (let x = 0; x < this.grid[y].length; x++) {
				const tile = this.grid[y][x];
				if (tile === TileType.SpawnPacman || tile === TileType.SpawnBlinky ||
					tile === TileType.SpawnInky || tile === TileType.SpawnPinky ||
					tile === TileType.SpawnClyde) {
					row += ' ';
				}
				else row += tile;
			}
			result.push(row);
		}
		return result;
	}

	/**
	 * Retourne la largeur et la hauteur de la carte
	 */
	public getWidth(): number {
		return this.grid[0]?.length || 0;
	}
	public getHeight(): number {
		return this.grid.length;
	}
}
