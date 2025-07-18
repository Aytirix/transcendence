import { map, vector2, TileType, CharacterType } from "@Pacman/TypesPacman";
import Pacman from "../Character/Pacman";
import { TILE_SIZE } from "../Engine";
import { WebSocket } from 'ws'

export default class PacmanMap {
	private grid: TileType[][];
	public width: number;
	public height: number;
	/**
	 * Map des téléporteurs : position source -> position destination
	 */
	private teleportMap: Map<string, vector2> = new Map();
	public teleportMapUnique: [vector2, vector2][] = [];
	public unassignedTeleports: vector2[] = [];
	public teleportErrors: Array<{ pos: vector2, reason: string }> = [];

	public respawnGhostPos: vector2 = { x: 0, y: 0 };

	public constructor(map: TileType[][], check: boolean = true, ws?: WebSocket) {
		this.grid = map;
		this.width = 0;
		for (let row of this.grid) this.width = Math.max(this.width, row.length);
		this.height = this.grid.length;
		const result = this.buildTeleportMap(ws?.i18n);
		this.teleportMap = result.teleportMap;
		this.teleportMapUnique = result.teleportMapUnique;
		this.unassignedTeleports = result.unassignedTeleports;
		this.teleportErrors = result.teleportErrors;
		if (check) this.findGhostRespawnPosition();
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
		if (tile === null || tile == TileType.Wall) return false;
		if (nameChar !== CharacterType.Pacman && tile === TileType.Teleport) return false;
		if (nameChar == CharacterType.Pacman && tile === TileType.GhostPortalBlock) return false;
		return true;
	}

	private findGhostRespawnPosition(): void {
		// ----------------------------------------------------------------
		// A) ON COMMENCE PAR TROUVER LE SPAWN DE PAC-MAN
		// ----------------------------------------------------------------
		let pacmanSpawn: vector2 | null = null;
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (this.grid[y][x] === TileType.SpawnPacman) {
					pacmanSpawn = { x, y };
					break;
				}
			}
			if (pacmanSpawn) break;
		}
		if (!pacmanSpawn) {
			throw new Error("Aucun spawn de Pacman trouvé !");
		}

		// ----------------------------------------------------------------
		// B) BFS POUR PAC-MAN : quelles cases Pac-man peut atteindre ?
		// ----------------------------------------------------------------
		const reachablePacman: boolean[][] = Array(this.height)
			.fill(0)
			.map(() => Array(this.width).fill(false));

		const queuePac: vector2[] = [];
		queuePac.push(pacmanSpawn);
		reachablePacman[pacmanSpawn.y][pacmanSpawn.x] = true;

		const dirs = [
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 }
		];

		while (queuePac.length > 0) {
			const cur = queuePac.shift()!;
			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < this.height &&
					nx >= 0 && nx < this.width &&
					!reachablePacman[ny][nx]
				) {
					if (this.isWalkable(CharacterType.Pacman, { x: nx, y: ny })) {
						reachablePacman[ny][nx] = true;
						queuePac.push({ x: nx, y: ny });
					}
				}
			}
		}

		// ----------------------------------------------------------------
		// C) BFS POUR LES FANTÔMES : quelles cases un fantôme peut atteindre ?
		//    On part de tout GhostPortalBlock ('-') car ils peuvent y être.
		// ----------------------------------------------------------------
		const reachableGhost: boolean[][] = Array(this.height)
			.fill(0)
			.map(() => Array(this.width).fill(false));

		const queueGhost: vector2[] = [];
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (this.grid[y][x] === TileType.GhostPortalBlock) {
					queueGhost.push({ x, y });
					reachableGhost[y][x] = true;
				}
			}
		}
		if (queueGhost.length === 0) {
			throw new Error("Aucun GhostPortalBlock trouvé dans la carte !");
		}

		while (queueGhost.length > 0) {
			const cur = queueGhost.shift()!;
			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < this.height &&
					nx >= 0 && nx < this.width &&
					!reachableGhost[ny][nx]
				) {
					if (this.isWalkable(CharacterType.Blinky, { x: nx, y: ny })) {
						reachableGhost[ny][nx] = true;
						queueGhost.push({ x: nx, y: ny });
					}
				}
			}
		}

		// ----------------------------------------------------------------
		// D) FLOOD-FILL DE LA “GHOST HOUSE” POUR DÉTECTER LES TUILES INTÉRIEURES
		//    (format pour le respawn), en partant de chaque '-'.
		// ----------------------------------------------------------------
		const visited: boolean[][] = Array(this.height)
			.fill(0)
			.map(() => Array(this.width).fill(false));
		const regionAll: vector2[] = [];
		const queueRegion: vector2[] = [];

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (this.grid[y][x] === TileType.GhostPortalBlock) {
					queueRegion.push({ x, y });
					visited[y][x] = true;
				}
			}
		}

		while (queueRegion.length > 0) {
			const cur = queueRegion.shift()!;
			regionAll.push(cur);

			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < this.height &&
					nx >= 0 && nx < this.width &&
					!visited[ny][nx]
				) {
					const tile = this.grid[ny][nx];
					// On propage partout sauf sur les murs (#) et téléporteurs (T)
					if (tile !== TileType.Wall && tile !== TileType.Teleport) {
						visited[ny][nx] = true;
						queueRegion.push({ x: nx, y: ny });
					}
				}
			}
		}

		// ----------------------------------------------------------------
		// E) EXTRACTION DES TUILES « X » :
		//    tuiles intérieures que les fantômes peuvent atteindre mais pas Pac-man.
		// ----------------------------------------------------------------
		const xCells: vector2[] = [];
		for (const p of regionAll) {
			const { x, y } = p;
			if (
				this.grid[y][x] !== TileType.GhostPortalBlock &&
				!reachablePacman[y][x] &&
				reachableGhost[y][x]
			) {
				xCells.push(p);
			}
		}
		if (xCells.length === 0) {
			throw new Error("Aucune cellule trouvée qui est atteignable seulement par les fantômes !");
		}

		// ----------------------------------------------------------------
		// F) IL DOIT AVOIR QU'UN SEUL PACKET DE CELLULES X
		// ----------------------------------------------------------------
		// Vérifier que les cellules X forment une seule région connectée
		const connectedX: Set<string> = new Set();
		if (xCells.length > 0) {
			const queue: vector2[] = [xCells[0]]; // Commence avec la première cellule X
			connectedX.add(`${xCells[0].x},${xCells[0].y}`);

			while (queue.length > 0) {
				const cur = queue.shift()!;

				// Vérifie les voisins dans les 4 directions
				for (const d of dirs) {
					const nx = cur.x + d.x;
					const ny = cur.y + d.y;
					const key = `${nx},${ny}`;

					// Si ce voisin est une cellule X et n'est pas encore visité
					if (!connectedX.has(key) && xCells.some(cell => cell.x === nx && cell.y === ny)) {
						connectedX.add(key);
						queue.push({ x: nx, y: ny });
					}
				}
			}

		}

		// ----------------------------------------------------------------
		// F) CALCUL DU CENTRE GÉOMÉTRIQUE DES CELLULES X
		// ----------------------------------------------------------------
		let sumX = 0, sumY = 0;
		for (const p of xCells) {
			sumX += p.x;
			sumY += p.y;
		}
		const avgX = sumX / xCells.length;
		const avgY = sumY / xCells.length;

		// ----------------------------------------------------------------
		// G) ON CHOISIT LA CELLULE X LA PLUS PROCHE DU CENTRE
		// ----------------------------------------------------------------
		let closest = xCells[0];
		let minDist = (closest.x - avgX) ** 2 + (closest.y - avgY) ** 2;
		for (const p of xCells) {
			const d2 = (p.x - avgX) ** 2 + (p.y - avgY) ** 2;
			if (d2 < minDist) {
				minDist = d2;
				closest = p;
			}
		}
		this.respawnGhostPos = {
			x: (closest.x * TILE_SIZE + TILE_SIZE / 2),
			y: (closest.y * TILE_SIZE + TILE_SIZE / 2)
		};

		// ----------------------------------------------------------------
		// H) DEBUG : on marque en 'X' chaque cellule X, puis 'R' sur le respawn
		// ----------------------------------------------------------------
		// const copyMap = this.grid.map(row => [...row]);
		// for (const p of xCells) {
		// 	copyMap[p.y][p.x] = 'X' as TileType;
		// }
		// copyMap[closest.y][closest.x] = 'R' as TileType;

		// console.log("new map :");
		// console.log(copyMap.map(r => r.join('')).join('\n'));
		// console.log(`Position de respawn des fantômes : (${closest.x}, ${closest.y})`);
	}

	/**
	 * Construit automatiquement la map des téléporteurs (pairs horizontaux ou verticaux)
	 */
	private buildTeleportMap(i18n?: any): { teleportMap: Map<string, vector2>, teleportMapUnique: [vector2, vector2][], unassignedTeleports: vector2[], teleportErrors: Array<{ pos: vector2, reason: string }> } {
		const h = this.grid.length;
		const w = this.grid[0].length;
		const teleports: Array<{ pos: vector2, direction: vector2 }> = [];
		const assignedDestinations = new Set<string>();
		const teleportMap = new Map<string, vector2>();
		const teleportErrors: Array<{ pos: vector2, reason: string }> = [];

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
					} else {
						// Téléporteur sans direction ouverte
						if (i18n) {
							teleportErrors.push({
								pos: { x, y },
								reason: i18n.t('pacman.validation.teleportSurroundedByWalls', { x, y })
							});
						}
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
				teleportMap.set(srcKey, farthestPair);

				// Connexion retour (destination -> source)
				const destKey = `${farthestPair.x},${farthestPair.y}`;
				teleportMap.set(destKey, src.pos);

				assignedDestinations.add(srcKey);
				assignedDestinations.add(destKey);
			}
		});

		// Collecter les téléporteurs non assignés avec leurs raisons
		const unassignedTeleports: vector2[] = [];
		teleports.forEach(teleport => {
			const teleportKey = `${teleport.pos.x},${teleport.pos.y}`;
			if (!teleportMap.has(teleportKey)) {
				const isHorizontal = teleport.direction.x !== 0;

				// Chercher des téléporteurs compatibles pour déterminer la raison
				const compatibleTeleports = teleports.filter(dest => {
					if (dest.pos.x === teleport.pos.x && dest.pos.y === teleport.pos.y) return false;

					if (isHorizontal) {
						return dest.pos.y === teleport.pos.y;
					} else {
						return dest.pos.x === teleport.pos.x;
					}
				});

				if (compatibleTeleports.length === 0) {
					if (i18n) {
						teleportErrors.push({
							pos: teleport.pos,
							reason: i18n.t('pacman.validation.teleportNoAlignment', {
								x: teleport.pos.x,
								y: teleport.pos.y,
								direction: `${i18n.t('pacman.validation.row')} | ${i18n.t('pacman.validation.column')}`
							})
						});
					}
				} else {
					const compatibleWithDirection = compatibleTeleports.filter(dest => {
						if (isHorizontal) {
							return Math.sign(dest.direction.x) === -Math.sign(teleport.direction.x);
						} else {
							return Math.sign(dest.direction.y) === -Math.sign(teleport.direction.y);
						}
					});

					if (compatibleWithDirection.length === 0) {
						if (i18n) {
							teleportErrors.push({
								pos: teleport.pos,
								reason: i18n.t('pacman.validation.teleportNoOppositeDirection', {
									x: teleport.pos.x,
									y: teleport.pos.y
								})
							});
						}
					} else {
						if (i18n) {
							teleportErrors.push({
								pos: teleport.pos,
								reason: i18n.t('pacman.validation.teleportOddNumber', {
									x: teleport.pos.x,
									y: teleport.pos.y
								})
							});
						}
					}
				}
				unassignedTeleports.push(teleport.pos);
			}
		});

		// dans single mode, on laisse dans teleportmap, on enleve les doublons
		const teleportMapUnique: [vector2, vector2][] = [];
		const processedPairs = new Set<string>();

		teleportMap.forEach((dest, key) => {
			const src = { x: Number(key.split(',')[0]), y: Number(key.split(',')[1]) };
			const pairKey1 = `${src.x},${src.y}->${dest.x},${dest.y}`;
			const pairKey2 = `${dest.x},${dest.y}->${src.x},${src.y}`;

			if (!processedPairs.has(pairKey1) && !processedPairs.has(pairKey2)) {
				teleportMapUnique.push([src, dest]);
				processedPairs.add(pairKey1);
				processedPairs.add(pairKey2);
			}
		});


		// Retourner la map des téléporteurs et les téléporteurs non assignés
		return {
			teleportMap,
			teleportMapUnique,
			unassignedTeleports,
			teleportErrors
		}
	}

	/**
	 * Consomme une pastille ou un bonus à la position donnée et retourne les points gagnés
	 * Retourne 0 si aucune pastille ou bonus n'est présent
	 */
	public consumePelletOrBonus(player: Pacman, pos: vector2): number {
		const tile = this.getTile(pos);

		if (tile === TileType.Pellet) {
			this.setTile(pos, TileType.Empty);
			player.score += 10;
			return 10;
		} else if (tile === TileType.Bonus) {
			this.setTile(pos, TileType.Empty);
			player.score += 50;
			return 50;
		}
		return 0;
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


	/**
	 * Calcule les zones accessibles seulement aux fantômes (pas à Pacman)
	 * @param grid La grille de la carte
	 * @returns Une matrice booléenne indiquant les zones accessibles seulement aux fantômes
	 */
	private static calculateGhostOnlyZones(grid: TileType[][]): boolean[][] {
		const height = grid.length;
		const width = grid[0]?.length || 0;

		// ----------------------------------------------------------------
		// A) TROUVER LE SPAWN DE PAC-MAN
		// ----------------------------------------------------------------
		let pacmanSpawn: vector2 | null = null;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (grid[y][x] === TileType.SpawnPacman) {
					pacmanSpawn = { x, y };
					break;
				}
			}
			if (pacmanSpawn) break;
		}
		if (!pacmanSpawn) {
			// Si pas de spawn Pacman, aucune zone n'est accessible seulement aux fantômes
			return Array(height).fill(0).map(() => Array(width).fill(false));
		}

		// ----------------------------------------------------------------
		// B) BFS POUR PAC-MAN : quelles cases Pac-man peut atteindre ?
		// ----------------------------------------------------------------
		const reachablePacman: boolean[][] = Array(height)
			.fill(0)
			.map(() => Array(width).fill(false));

		const queuePac: vector2[] = [];
		queuePac.push(pacmanSpawn);
		reachablePacman[pacmanSpawn.y][pacmanSpawn.x] = true;

		const dirs = [
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 }
		];

		while (queuePac.length > 0) {
			const cur = queuePac.shift()!;
			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < height &&
					nx >= 0 && nx < width &&
					!reachablePacman[ny][nx]
				) {
					const tile = grid[ny][nx];
					if (tile !== TileType.Wall && tile !== TileType.GhostPortalBlock && tile !== TileType.Teleport) {
						reachablePacman[ny][nx] = true;
						queuePac.push({ x: nx, y: ny });
					}
				}
			}
		}

		// ----------------------------------------------------------------
		// C) BFS POUR LES FANTÔMES : quelles cases un fantôme peut atteindre ?
		// ----------------------------------------------------------------
		const reachableGhost: boolean[][] = Array(height)
			.fill(0)
			.map(() => Array(width).fill(false));

		const queueGhost: vector2[] = [];
		// Commencer par tous les GhostPortalBlock et spawns de fantômes
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const tile = grid[y][x];
				if (tile === TileType.GhostPortalBlock ||
					tile === TileType.SpawnBlinky ||
					tile === TileType.SpawnInky ||
					tile === TileType.SpawnPinky ||
					tile === TileType.SpawnClyde) {
					queueGhost.push({ x, y });
					reachableGhost[y][x] = true;
				}
			}
		}

		while (queueGhost.length > 0) {
			const cur = queueGhost.shift()!;
			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < height &&
					nx >= 0 && nx < width &&
					!reachableGhost[ny][nx]
				) {
					const tile = grid[ny][nx];
					if (tile !== TileType.Wall && tile !== TileType.Teleport) {
						reachableGhost[ny][nx] = true;
						queueGhost.push({ x: nx, y: ny });
					}
				}
			}
		}

		// ----------------------------------------------------------------
		// D) ZONES ACCESSIBLES SEULEMENT AUX FANTÔMES
		// ----------------------------------------------------------------
		const ghostOnlyZones: boolean[][] = Array(height)
			.fill(0)
			.map(() => Array(width).fill(false));

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				// Une zone est accessible seulement aux fantômes si :
				// - Les fantômes peuvent l'atteindre
				// - Pacman ne peut pas l'atteindre
				ghostOnlyZones[y][x] = reachableGhost[y][x] && !reachablePacman[y][x];
			}
		}

		return ghostOnlyZones;
	}

	/**
	 * Calcule les zones accessibles à Pacman
	 * @param grid La grille de la carte
	 * @returns Une matrice booléenne indiquant les zones accessibles à Pacman
	 */
	private static calculatePacmanReachableZones(grid: TileType[][]): boolean[][] {
		const height = grid.length;
		const width = grid[0]?.length || 0;

		// ----------------------------------------------------------------
		// A) TROUVER LE SPAWN DE PAC-MAN
		// ----------------------------------------------------------------
		let pacmanSpawn: vector2 | null = null;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (grid[y][x] === TileType.SpawnPacman) {
					pacmanSpawn = { x, y };
					break;
				}
			}
			if (pacmanSpawn) break;
		}
		if (!pacmanSpawn) {
			// Si pas de spawn Pacman, aucune zone n'est accessible
			return Array(height).fill(0).map(() => Array(width).fill(false));
		}

		// ----------------------------------------------------------------
		// B) BFS POUR PAC-MAN : quelles cases Pac-man peut atteindre ?
		// ----------------------------------------------------------------
		const reachablePacman: boolean[][] = Array(height)
			.fill(0)
			.map(() => Array(width).fill(false));

		const queuePac: vector2[] = [];
		queuePac.push(pacmanSpawn);
		reachablePacman[pacmanSpawn.y][pacmanSpawn.x] = true;

		const dirs = [
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 }
		];

		while (queuePac.length > 0) {
			const cur = queuePac.shift()!;
			for (const d of dirs) {
				const nx = cur.x + d.x;
				const ny = cur.y + d.y;
				if (
					ny >= 0 && ny < height &&
					nx >= 0 && nx < width &&
					!reachablePacman[ny][nx]
				) {
					const tile = grid[ny][nx];
					if (tile !== TileType.Wall && tile !== TileType.GhostPortalBlock && tile !== TileType.Teleport) {
						reachablePacman[ny][nx] = true;
						queuePac.push({ x: nx, y: ny });
					}
				}
			}
		}

		return reachablePacman;
	}

	/**
 * Vérifie si la carte est valide selon les règles du jeu
 * @returns un objet contenant un booléen indiquant si la carte est valide et un tableau d'erreurs
 */
	public static validateMap(grid: TileType[][], ws: WebSocket): { is_valid: boolean, errors: string[], teleportMap: [vector2, vector2][], unassignedTeleports: vector2[] } {
		const errors: string[] = [];

		// Vérification des dimensions (31 lignes de 29 caractères)
		if (grid.length !== 31) {
			errors.push(ws.i18n.t('pacman.validation.mapDimensions', { count: grid.length }));
		}

		for (let y = 0; y < grid.length; y++) {
			if (grid[y].length !== 29) {
				errors.push(ws.i18n.t('pacman.validation.lineDimensions', { line: y, count: grid[y].length }));
			}
		}

		// Caractères autorisés et comptage des éléments
		const validChars = new Set(['#', 'T', 'o', 'B', 'I', 'C', 'Y', 'P', '.', '-', ' ']);
		let pelletCount = 0;
		const spawnCounts = {
			'P': 0, // Pacman
			'B': 0, // Blinky
			'I': 0, // Inky
			'C': 0, // Clyde
			'Y': 0, // Pinky
		};

		// Vérification des bordures et comptage des éléments
		let error_limit = 5;
		for (let y = 0; y < grid.length && error_limit > 0; y++) {
			for (let x = 0; x < grid[y].length; x++) {
				const tile = grid[y][x];

				// Vérification des caractères autorisés
				if (!validChars.has(tile)) {
					errors.push(ws.i18n.t('pacman.validation.invalidCharacter', { tile, x, y }));
					error_limit--;
				}

				// Comptage des pastilles
				if (tile === TileType.Pellet || tile === TileType.Bonus) {
					pelletCount++;
				}

				// Comptage des spawns
				if ([TileType.SpawnPacman, TileType.SpawnBlinky, TileType.SpawnInky,
				TileType.SpawnClyde, TileType.SpawnPinky].includes(tile)) {
					spawnCounts[tile]++;
				}
			}
		}

		// Vérification du nombre minimal de pastilles
		if (pelletCount < 25) {
			errors.push(ws.i18n.t('pacman.validation.minPellets', { count: pelletCount }));
		}

		let duplicatedSpawns = false;
		// Vérification des spawns (un seul par entité)
		for (const [char, count] of Object.entries(spawnCounts)) {
			if (count === 0) {
				errors.push(ws.i18n.t('pacman.validation.noSpawnFound', { char }));
			} else if (count > 1) {
				duplicatedSpawns = true;
				errors.push(ws.i18n.t('pacman.validation.duplicateSpawn', { char, count }));
			}
		}


		// Vérification que les spawns des fantômes sont correctement entourés
		if (!duplicatedSpawns) {
			const ghostSpawns = ['B', 'I', 'C', 'Y'];

			// Calculer les zones accessibles seulement aux fantômes
			const ghostOnlyZones = PacmanMap.calculateGhostOnlyZones(grid);

			// Vérifier qu'il y a au moins un portail fantôme dans la carte
			let hasGhostPortal = false;
			for (let y = 0; y < grid.length && !hasGhostPortal; y++) {
				for (let x = 0; x < grid[y].length && !hasGhostPortal; x++) {
					if (grid[y][x] === TileType.GhostPortalBlock) {
						hasGhostPortal = true;
					}
				}
			}

			for (let y = 0; y < grid.length; y++) {
				for (let x = 0; x < grid[y].length; x++) {
					const tile = grid[y][x];

					if (ghostSpawns.includes(tile)) {
						// Vérifier les cases adjacentes (haut, bas, gauche, droite)
						const adjacentPositions = [
							{ x, y: y - 1 }, // haut
							{ x, y: y + 1 }, // bas
							{ x: x - 1, y }, // gauche
							{ x: x + 1, y }  // droite
						];

						let isProtected = true;

						for (const pos of adjacentPositions) {
							if (pos.y >= 0 && pos.y < grid.length &&
								pos.x >= 0 && pos.x < grid[pos.y].length) {
								const adjTile = grid[pos.y][pos.x];

								if (adjTile !== TileType.Wall &&
									adjTile !== TileType.GhostPortalBlock &&
									!ghostSpawns.includes(adjTile)) {
									// Vérifier si cette case fait partie d'une zone accessible seulement aux fantômes
									const isGhostOnlyZone = ghostOnlyZones[pos.y] && ghostOnlyZones[pos.y][pos.x];
									if (!isGhostOnlyZone) {
										isProtected = false;
									}
								}
							}
						}

						if (!isProtected) {
							errors.push(ws.i18n.t('pacman.validation.ghostSpawnNotProtected', { tile, x, y }));
							break;
						}
					}
				}
			}

			// Vérification globale : s'il y a des spawns de fantômes, il doit y avoir au moins un portail fantôme
			if (!hasGhostPortal) {
				const hasAnyGhostSpawn = Object.values(spawnCounts).some(count => count > 0 &&
					['B', 'I', 'C', 'Y'].includes(Object.keys(spawnCounts)[Object.values(spawnCounts).indexOf(count)]));
				if (hasAnyGhostSpawn) {
					errors.push(ws.i18n.t('pacman.validation.ghostZoneNoExit'));
				}
			}
		}

		// Vérification que toutes les pastilles et super-pastilles sont accessibles à Pacman
		const pacmanReachableZones = PacmanMap.calculatePacmanReachableZones(grid);
		for (let y = 0; y < grid.length; y++) {
			for (let x = 0; x < grid[y].length; x++) {
				const tile = grid[y][x];
				if (tile === TileType.Pellet || tile === TileType.Bonus) {
					if (!pacmanReachableZones[y] || !pacmanReachableZones[y][x]) {
						errors.push(ws.i18n.t('pacman.validation.pelletNotAccessible', { x, y }));
					}
				}
			}
		}

		const testmap = new PacmanMap(grid, false, ws);

		// Ajouter les erreurs de téléporteurs
		for (const teleportError of testmap.teleportErrors) {
			errors.push(teleportError.reason);
		}

		return {
			is_valid: errors.length === 0,
			errors: errors,
			teleportMap: testmap.teleportMapUnique,
			unassignedTeleports: testmap.unassignedTeleports
		}
	}
}
