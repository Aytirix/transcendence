import { player, room, GameState, vector2, TileType, CharacterType } from "@Pacman/TypesPacman";
import Pacman from "../Character/Pacman";
import { TILE_SIZE } from "../Engine";


export default class PacmanMap {
	private grid: TileType[][];
	public width: number;
	public height: number;
	/**
	 * Map des téléporteurs : position source -> position destination
	 */
	private teleportMap: Map<string, vector2> = new Map();

	public constructor(grid: string[]) {
		this.grid = this.fromNumbers(grid);
		this.width = 0;
		for (let row of this.grid) this.width = Math.max(this.width, row.length);
		this.height = this.grid.length;
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
	public isWalkable(nameChar: CharacterType, pos: vector2): boolean {
		const tile = this.getTile(pos);
		return tile !== null && tile !== TileType.Wall && ((nameChar == CharacterType.Pacman && tile !== TileType.GhostPortalBlock) || (nameChar != CharacterType.Pacman));
	}

	/**
	 * Construit automatiquement la map des téléporteurs (pairs horizontaux ou verticaux)
	 */
	private buildTeleportMap(): void {
		const h = this.grid.length;
		const w = this.grid[0].length;
		const teleports: Array<{ pos: vector2, direction: vector2 }> = [];
		const assignedDestinations = new Set<string>();

		// Collecte toutes les tuiles Teleport et détermine leur direction
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				if (this.grid[y][x] === TileType.Teleport) {
					// Détermine la direction du téléporteur en vérifiant les murs adjacents
					const directions = [
						{ x: 0, y: -1 }, // haut
						{ x: 0, y: 1 },  // bas
						{ x: -1, y: 0 }, // gauche
						{ x: 1, y: 0 }   // droite
					];

					// Trouve la direction qui n'a pas de mur (le "sens" du téléporteur)
					const openDirection = directions.find(dir => {
						const checkPos = { x: x + dir.x, y: y + dir.y };
						const tile = this.getTile(checkPos);
						return tile !== null && tile !== TileType.Wall;
					});

					if (openDirection) {
						teleports.push({
							pos: { x, y },
							direction: openDirection
						});
					}
				}
			}
		}

		// Traitez les téléporteurs en priorité par ceux qui ont le moins d'options
		const sortedTeleports = [...teleports].sort((a, b) => {
			const aOptions = teleports.filter(t =>
				t.pos.x !== a.pos.x || t.pos.y !== a.pos.y
			).length;
			const bOptions = teleports.filter(t =>
				t.pos.x !== b.pos.x || t.pos.y !== b.pos.y
			).length;
			return aOptions - bOptions;
		});

		// Pour chaque téléporteur, trouve le téléporteur le plus loin aligné
		sortedTeleports.forEach(src => {
			// Vérifie si ce téléporteur source est déjà assigné comme destination
			const srcKey = `${src.pos.x},${src.pos.y}`;
			if (assignedDestinations.has(srcKey)) return;

			// On ne considère que les téléporteurs ayant une direction compatible
			const isHorizontal = src.direction.x !== 0;
			const possibleDestinations = teleports.filter(dest => {
				// Exclure le téléporteur source
				if (dest.pos.x === src.pos.x && dest.pos.y === src.pos.y) return false;

				// Exclure les téléporteurs déjà assignés comme destination
				const destKey = `${dest.pos.x},${dest.pos.y}`;
				if (assignedDestinations.has(destKey)) return false;

				// Pour les téléporteurs horizontaux, vérifier l'alignement sur l'axe Y
				if (isHorizontal) {
					return dest.pos.y === src.pos.y &&
						// Directions opposées (si src pointe à droite, dest doit pointer à gauche)
						Math.sign(dest.direction.x) === -Math.sign(src.direction.x);
				}
				// Pour les téléporteurs verticaux, vérifier l'alignement sur l'axe X
				else {
					return dest.pos.x === src.pos.x &&
						// Directions opposées (si src pointe en bas, dest doit pointer en haut)
						Math.sign(dest.direction.y) === -Math.sign(src.direction.y);
				}
			});

			// Trouver le téléporteur le plus éloigné
			let farthestPair: vector2 | null = null;
			let maxDistance = -1;

			for (const dest of possibleDestinations) {
				const distance = isHorizontal
					? Math.abs(dest.pos.x - src.pos.x)
					: Math.abs(dest.pos.y - src.pos.y);

				if (distance > maxDistance) {
					maxDistance = distance;
					farthestPair = dest.pos;
				}
			}

			// Associer le téléporteur source avec le téléporteur destination le plus éloigné
			if (farthestPair) {
				// Connexion aller (source -> destination)
				this.teleportMap.set(srcKey, farthestPair);

				// Connexion retour (destination -> source)
				const destKey = `${farthestPair.x},${farthestPair.y}`;
				this.teleportMap.set(destKey, src.pos);

				// Marquer les deux téléporteurs comme assignés
				assignedDestinations.add(srcKey);
				assignedDestinations.add(destKey);
			}
		});
		teleports.forEach(teleport => {
			const teleportKey = `${teleport.pos.x},${teleport.pos.y}`;
			if (!this.teleportMap.has(teleportKey)) {
				this.setTile(teleport.pos, TileType.Wall);
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
	public getTeleportDestination(pos: vector2): vector2 | null {
		const key = `${pos.x},${pos.y}`;
		let tp = this.teleportMap.get(key) || null;
		if (!tp) return null;
		tp = {
			x: Math.round(tp.x * TILE_SIZE + TILE_SIZE / 2),
			y: Math.round(tp.y * TILE_SIZE + TILE_SIZE / 2)
		};
		return tp;
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
