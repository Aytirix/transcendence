// models/GameModel.ts
import executeReq from '@models/database';

// Interfaces TypeScript
interface User {
	id: number;
}

interface Session {
	user: User;
	gameState?: GameState;
}

interface GameSettings {
	board_size: number;
	difficultyLevel: number;
	autoCross: number;
}

interface GameMap {
	id: number | null;
	board_size: number | null;
	regionAssignment: number[][] | null;
	difficultyLevel: number | null;
	solutionMapping: Array<[number, number]> | null;
}

interface GameStateData {
	boardState: number[][] | null;
	regionColors: string[] | null;
	moveHistory: Array<Array<{ row: number; col: number; from: number; to: number }>> | null;
	nbHint: number | null;
}

interface GameState {
	setting: GameSettings;
	map: GameMap;
	state: GameStateData;
}

interface GameResult {
	status: 'success' | 'error';
	game?: GameState;
	message?: { message: string; type: string };
}

interface Move {
	row: number;
	col: number;
	from: number;
	to: number;
}

interface DatabaseRow {
	id: number;
	board_size: number;
	difficultyLevel: number;
	autoCross: number;
	game_state: string;
	regionAssignment: string;
	solutionMapping: string;
}

interface UpdateParams {
	board_size?: number;
	difficultyLevel?: number;
	autoCross?: number;
}

const allowedColors: string[] = [
	"rgb(107, 142, 35)",  // Olive Drab
	"rgb(123, 104, 238)", // Medium Slate Blue
	"rgb(79, 79, 79)",    // Gray29
	"rgb(0, 0, 205)",     // Medium Blue
	"rgb(186, 85, 211)",  // Medium Orchid
	"rgb(60, 179, 113)",  // Medium Sea Green
	"rgb(119, 136, 153)", // Light Slate Gray
	"rgb(72, 61, 139)",   // Dark Slate Blue
	"rgb(178, 34, 34)",   // Firebrick
	"rgb(210, 105, 30)",  // Chocolate
	"rgb(85, 107, 47)",   // Dark Olive Green
	"rgb(106, 60, 197)",  // Medium Purple
	"rgb(135, 206, 250)", // Light Sky Blue
	"rgb(25, 113, 25)",   // Lime Green
	"rgb(139, 69, 19)",   // Saddle Brown
	"rgb(0, 139, 139)",   // Dark Cyan
	"rgb(169, 169, 169)", // Dark Gray
	"rgb(54, 54, 123)",   // Midnight Blue
	"rgb(106, 90, 205)",  // Slate Blue
	"rgb(255, 140, 0)"    // Dark Orange
];


/**
 * Classe de base regroupant la logique principale du jeu.
 * Les méthodes spécifiques (chargement de map, nouvelle partie, hint, solution, etc.)
 * seront implémentées dans les classes filles.
 */
class GameModel {
	protected session: Session;
	private initPromise: Promise<void>;

	/**
	 * Le constructeur reçoit la session (ex: req.session)
	 */
	constructor(user_id: number) {
		this.session = {
			user: { id: user_id },
			gameState: undefined
		};
		this.initPromise = this.init_gameState();
	}

	/**
	 * S'assure que l'état du jeu est initialisé
	 */
	protected async ensureInitialized(): Promise<void> {
		await this.initPromise;
	}

	/**
	 * Initialise l'état du jeu dans la session.
	 */
	async init_gameState(): Promise<void> {
		// faire une rrequete a la base de données pour récupérer les paramètres de l'utilisateur
		const req: any = await executeReq(
			`SELECT * FROM queens_settings WHERE user_id = ?`,
			[this.session.user.id]
		) as Promise<DatabaseRow[]>;

		if (req && req.length > 0) {
			const row = req[0];
			this.session.gameState = {
				setting: {
					board_size: row.board_size,
					difficultyLevel: row.difficultyLevel,
					autoCross: row.autoCross
				},
				map: {
					id: null,
					board_size: null,
					regionAssignment: null,
					difficultyLevel: null,
					solutionMapping: null
				},
				state: {
					boardState: null,
					regionColors: null,
					moveHistory: null,
					nbHint: null
				}
			};
			if (row.game_state) {
				try {
					const game_state = JSON.parse(row.game_state);
					this.session.gameState = game_state;
				} catch (e) {
				}
			}
		} else {
			this.session.gameState = {
				setting: {
					board_size: 9,
					difficultyLevel: 5,
					autoCross: 0
				},
				map: {
					id: null,
					board_size: null,
					regionAssignment: null,
					difficultyLevel: null,
					solutionMapping: null
				},
				state: {
					boardState: null,
					regionColors: null,
					moveHistory: null,
					nbHint: null
				}
			};
		}
	}

	/**
	 * Vérifie l'état actuel du jeu et met à jour les états (conflits, victoire, etc.).
	 */
	async check_game_state(update_db: boolean = true): Promise<GameResult> {
		await this.ensureInitialized();
		if (!this.session.gameState) {
			return { status: 'error', message: { message: 'Game not initialized', type: 'error' } };
		}
		const game = this.session.gameState;
		const board_size = game.map.board_size!;
		const autoCross = game.setting.autoCross;
		let message: { message: string; type: string } = { message: '', type: '' };

		// Initialisation des compteurs pour régions, lignes et colonnes
		const regionQueenCounts: number[] = new Array(board_size).fill(0);
		const rowQueenCounts: number[] = new Array(board_size).fill(0);
		const colQueenCounts: number[] = new Array(board_size).fill(0);

		// On considère qu'une case contenant 2 ou 3 représente une reine
		const queens: Array<{ r: number; c: number }> = [];

		// Parcours du plateau pour compter les reines
		for (let r = 0; r < board_size; r++) {
			for (let c = 0; c < board_size; c++) {
				if (game.state.boardState![r][c] === 2 || game.state.boardState![r][c] === 3) {
					queens.push({ r, c });
					const reg = game.map.regionAssignment![r][c];
					regionQueenCounts[reg]++;
					rowQueenCounts[r]++;
					colQueenCounts[c]++;
				}
			}
		}

		// Création d'un ensemble pour mémoriser les positions en conflit
		const conflictPositions = new Set<string>();

		// Vérification des conflits d'adjacence (8 directions)
		const directions = [
			{ dr: -1, dc: -1 },
			{ dr: -1, dc: 0 },
			{ dr: -1, dc: 1 },
			{ dr: 0, dc: -1 },
			{ dr: 0, dc: 1 },
			{ dr: 1, dc: -1 },
			{ dr: 1, dc: 0 },
			{ dr: 1, dc: 1 }
		];
		for (const { r, c } of queens) {
			for (const { dr, dc } of directions) {
				const nr = r + dr;
				const nc = c + dc;
				if (nr >= 0 && nr < board_size && nc >= 0 && nc < board_size) {
					if (game.state.boardState![nr][nc] === 2 || game.state.boardState![nr][nc] === 3) {
						conflictPositions.add(`${r}-${c}`);
						conflictPositions.add(`${nr}-${nc}`);
					}
				}
			}
		}

		// Vérification des conflits pour région, ligne et colonne
		for (const { r, c } of queens) {
			const reg = game.map.regionAssignment![r][c];
			if (regionQueenCounts[reg] !== 1) conflictPositions.add(`${r}-${c}`);
			if (rowQueenCounts[r] !== 1) conflictPositions.add(`${r}-${c}`);
			if (colQueenCounts[c] !== 1) conflictPositions.add(`${r}-${c}`);
		}

		// Mise à jour du boardState pour les reines
		for (const { r, c } of queens) {
			if (conflictPositions.has(`${r}-${c}`)) {
				game.state.boardState![r][c] = 3;
			} else {
				game.state.boardState![r][c] = 2;
			}
		}

		// Mise à jour des auto-cross
		if (autoCross) {
			// Effacer les anciennes croix
			for (let r = 0; r < board_size; r++) {
				for (let c = 0; c < board_size; c++) {
					if (game.state.boardState![r][c] === 4) game.state.boardState![r][c] = 0;
				}
			}
			// Placer une croix sur la ligne et la colonne de chaque reine et en diagonale sur la premier case
			for (const { r, c } of queens) {
				for (let col = 0; col < board_size; col++) {
					if (game.state.boardState![r][col] === 0) game.state.boardState![r][col] = 4;
				}
				for (let row = 0; row < board_size; row++) {
					if (game.state.boardState![row][c] === 0) game.state.boardState![row][c] = 4;
				}
				if (r + 1 < board_size && c - 1 >= 0 && game.state.boardState![r + 1][c - 1] === 0) game.state.boardState![r + 1][c - 1] = 4;
				if (r - 1 >= 0 && c + 1 < board_size && game.state.boardState![r - 1][c + 1] === 0) game.state.boardState![r - 1][c + 1] = 4;
				if (r + 1 < board_size && c + 1 < board_size && game.state.boardState![r + 1][c + 1] === 0) game.state.boardState![r + 1][c + 1] = 4;
				if (r - 1 >= 0 && c - 1 >= 0 && game.state.boardState![r - 1][c - 1] === 0) game.state.boardState![r - 1][c - 1] = 4;
			}
		} else {
			// Effacer les croix si autoCross est désactivé
			for (let r = 0; r < board_size; r++) {
				for (let c = 0; c < board_size; c++) {
					if (game.state.boardState![r][c] === 4) game.state.boardState![r][c] = 0;
				}
			}
		}

		// Condition de victoire : une reine par région, ligne et colonne sans conflit
		const win =
			queens.length === board_size &&
			regionQueenCounts.every(count => count === 1) &&
			rowQueenCounts.every(count => count === 1) &&
			colQueenCounts.every(count => count === 1) &&
			conflictPositions.size === 0;

		if (win) {
			message = { message: "Bravo, vous avez gagné !", type: "victory" };
		} else if (conflictPositions.size > 0) {
			message = { message: "Il doit y avoir exactement une reine par région, ligne et colonne et aucune reine adjacente.", type: "error" };
		} else {
			message = { message: "", type: "" };
		}

		if (update_db) {
			await this.updateParameters(this.session.gameState.setting, false);
		}
		return { status: 'success', game, message };
	}

	/**
	 * Joue un coup en mettant à jour l'état du plateau et l'historique.
	 */
	async makeMove(row: number, col: number, newState: number): Promise<GameResult> {
		await this.ensureInitialized();
		if (!this.session.gameState) {
			return { status: 'error', message: { message: "Game not initialized", type: "error" } };
		}
		const game = this.session.gameState;
		const current = game.state.boardState![row][col];
		game.state.moveHistory!.push([{ row, col, from: current, to: newState }]);
		game.state.boardState![row][col] = newState;
		this.session.gameState = game;

		return await this.check_game_state();
	}

	/**
	 * Annule le dernier coup joué.
	 */
	async undo(): Promise<GameResult> {
		await this.ensureInitialized();
		if (!this.session.gameState) {
			return { status: 'error', message: { message: "Game not initialized", type: "error" } };
		}
		const game = this.session.gameState;
		if (!game.state.moveHistory || game.state.moveHistory.length === 0) {
			return { status: 'error', message: { message: "Aucun coup à annuler", type: "info" } };
		}
		const lastMove = game.state.moveHistory.pop()!;
		lastMove.forEach(move => {
			game.state.boardState![move.row][move.col] = move.from;
		});
		this.session.gameState = game;
		return await this.check_game_state();
	}

	/**
	 * Met à jour les paramètres de la partie et recharge éventuellement la map.
	 * Note : la méthode loadMapFromDB devra être implémentée dans les classes filles (ex: GameSolo)
	 */
	async updateParameters(params: UpdateParams, reloadMap: boolean = true): Promise<GameResult> {
		await this.ensureInitialized();
		let board_size = params.board_size || (this.session.gameState ? this.session.gameState.map.board_size : 9);
		let difficultyLevel = params.difficultyLevel || (this.session.gameState ? this.session.gameState.setting.difficultyLevel : 5);
		let autoCross = params.autoCross;
		if (this.session.gameState!.setting.autoCross != autoCross) {
			reloadMap = false;
		}
		if (reloadMap && 'loadMapFromDB' in this && typeof (this as any).loadMapFromDB === 'function') {
			const game = await (this as any).loadMapFromDB(board_size, difficultyLevel);
			if (!game) {
				return { status: 'error', message: { message: "Impossible de charger une map pour ces paramètres.", type: "error" } };
			}
		}
		try {
			await executeReq(
				`INSERT INTO queens_settings (user_id, board_size, difficultyLevel, autoCross, game_state)
				 VALUES (?, ?, ?, ?, ?)
				 ON CONFLICT(user_id) DO UPDATE SET
					board_size = excluded.board_size,
					difficultyLevel = excluded.difficultyLevel,
					autoCross = excluded.autoCross,
					game_state = excluded.game_state`,
				[
					this.session.user.id,
					board_size,
					this.session.gameState!.setting.difficultyLevel,
					autoCross,
					JSON.stringify(this.session.gameState)
				]
			);
		} catch (err) {
			console.error(err);
			return { status: 'error', message: { message: "Erreur interne", type: "error" } };
		}
		this.session.gameState!.setting.board_size = board_size!;
		this.session.gameState!.setting.autoCross = autoCross!;
		return await this.check_game_state(false);
	}
}

/**
 * Classe pour le mode solo.
 * Ici on ajoute les méthodes spécifiques au mode solo : chargement de map, création de partie,
 * fourniture d’un indice (hint), affichage de la solution et récupération de la partie depuis la DB.
 */
class GameSolo extends GameModel {
	/**
	 * Charge une map depuis la base de données en fonction des paramètres.
	 */
	async loadMapFromDB(board_size: number, difficultyLevel: number): Promise<GameState | null> {
		try {
			// 1. Recherche d'une map avec board_size ET difficultyLevel exacts
			let rows = await executeReq(
				`SELECT * FROM queens_map_valid
		 WHERE board_size = ? AND difficultyLevel = ?
		 ORDER BY RANDOM()
		 LIMIT 1000`,
				[board_size, difficultyLevel]
			) as DatabaseRow[];

			// 2. Si aucune map n'est trouvée, recherche avec board_size fixe et difficultyLevel le plus proche
			if (!rows || rows.length === 0) {
				const baseline = this.session.gameState!.setting.difficultyLevel;
				let orderClause: string;
				if (difficultyLevel >= baseline) {
					// Si on augmente la difficulté, on privilégie les maps dont difficultyLevel est supérieur ou égal
					orderClause = "ORDER BY (difficultyLevel >= ?) DESC, ABS(difficultyLevel - ?) ASC, RANDOM()";
				} else {
					// Si on diminue la difficulté, on privilégie les maps dont difficultyLevel est inférieur ou égal
					orderClause = "ORDER BY (difficultyLevel <= ?) DESC, ABS(difficultyLevel - ?) ASC, RANDOM()";
				}
				rows = await executeReq(
					`SELECT * FROM queens_map_valid
		   WHERE board_size = ?
		   ${orderClause}
		   LIMIT 500`,
					[board_size, difficultyLevel, difficultyLevel]
				) as DatabaseRow[];
				if (rows[0]?.difficultyLevel === this.session.gameState!.setting.difficultyLevel) return null;

				if (rows && board_size === this.session.gameState!.setting.board_size && difficultyLevel !== this.session.gameState!.setting.difficultyLevel) {
					rows = rows.filter(row => row.difficultyLevel !== this.session.gameState!.setting.difficultyLevel);
				}
			}

			if (!rows || rows.length === 0) return null;


			// Sélection aléatoire parmi les résultats trouvés
			const row = rows[Math.floor(Math.random() * rows.length)];

			// Mise à jour de l'état du jeu
			this.session.gameState!.setting.difficultyLevel = row.difficultyLevel;
			this.session.gameState!.map.id = row.id;
			this.session.gameState!.map.board_size = row.board_size;
			this.session.gameState!.map.regionAssignment = JSON.parse(row.regionAssignment);
			this.session.gameState!.map.difficultyLevel = row.difficultyLevel;
			this.session.gameState!.map.solutionMapping = JSON.parse(row.solutionMapping);
			this.session.gameState!.state.moveHistory = [];
			this.session.gameState!.state.nbHint = 0;
			this.session.gameState!.state.boardState = Array.from(
				{ length: this.session.gameState!.map.board_size },
				() => Array(this.session.gameState!.map.board_size).fill(0)
			);
			this.session.gameState!.state.regionColors = allowedColors
				.sort(() => 0.5 - Math.random())
				.slice(0, this.session.gameState!.map.board_size);

			await this.updateParameters(this.session.gameState!.setting, false);
			return this.session.gameState;
		} catch (err) {
			console.error(err);
			return null;
		}
	}

	/**
	 * Crée une nouvelle partie avec les paramètres fournis.
	 */
	async newGame(): Promise<GameResult> {
		await this.ensureInitialized();
		const game = await this.loadMapFromDB(this.session.gameState!.setting.board_size, this.session.gameState!.setting.difficultyLevel);
		if (!game) {
			return { status: 'error', message: { message: "Impossible de charger une map pour ces paramètres.", type: "error" } };
		}
		return { status: 'success', game: this.session.gameState, message: { message: "", type: "" } };
	}

	/**
	 * Fournit un indice en plaçant une reine sur une région sans reine.
	 */
	async hint(): Promise<GameResult> {
		await this.ensureInitialized();
		if (!this.session.gameState) {
			return { status: 'error', message: { message: "Game not initialized", type: "error" } };
		}
		const game = this.session.gameState;
		const board_size = game.map.board_size!;
		const regionQueenCounts: number[] = new Array(board_size).fill(0);
		for (let r = 0; r < board_size; r++) {
			for (let c = 0; c < board_size; c++) {
				if (game.state.boardState![r][c] === 2) {
					const reg = game.map.regionAssignment![r][c];
					regionQueenCounts[reg]++;
				}
			}
		}
		let hinted = false;
		for (let reg = 0; reg < board_size; reg++) {
			if (regionQueenCounts[reg] === 0 && game.map.solutionMapping![reg]) {
				const [r, c] = game.map.solutionMapping![reg];
				game.state.boardState![r][c] = 2;
				game.state.nbHint!++;
				hinted = true;
				break;
			}
		}
		if (hinted) {
			this.session.gameState = game;
			return await this.check_game_state();
		} else {
			return { status: 'error', message: { message: "Aucun indice disponible", type: "info" } };
		}
	}

	/**
	 * Affiche la solution en réinitialisant le plateau avec la position correcte des reines.
	 */
	async solution(): Promise<GameResult> {
		await this.ensureInitialized();
		if (!this.session.gameState) {
			return { status: 'error', message: { message: "Game not initialized", type: "error" } };
		}
		const game = this.session.gameState;
		const board_size = game.map.board_size!;
		const boardState: number[][] = [];
		for (let r = 0; r < board_size; r++) {
			boardState[r] = Array(board_size).fill(0);
		}
		for (let reg = 0; reg < game.map.board_size!; reg++) {
			if (game.map.solutionMapping![reg]) {
				const [r, c] = game.map.solutionMapping![reg];
				boardState[r][c] = 2;
			}
		}
		game.state.boardState = boardState;
		game.state.moveHistory = [];
		game.state.nbHint = board_size;
		this.session.gameState = game;
		return await this.check_game_state();
	}

	/**
	 * Récupère l'état actuel de la partie depuis la base de données.
	 */
	async getGame(): Promise<GameResult> {
		await this.ensureInitialized();
		if (this.session.gameState) {
			return { status: 'success', game: this.session.gameState };
		}
		try {
			const rows = await executeReq(
				`SELECT * FROM queens_settings WHERE user_id = ?`,
				[this.session.user.id]
			) as DatabaseRow[];
			if (!rows || rows.length === 0)
				return { status: 'error', message: { message: "Aucune partie trouvée", type: "error" } };
			const row = rows[0];
			if (row) {
				this.session.gameState!.setting.board_size = row.board_size;
				this.session.gameState!.setting.difficultyLevel = row.difficultyLevel;
				this.session.gameState!.setting.autoCross = row.autoCross;
				const game_state = JSON.parse(row.game_state);
				if (game_state && game_state.map.regionAssignment && game_state.map.regionAssignment.length > 0) {
					this.session.gameState!.map.id = game_state.map.id;
					this.session.gameState!.map.board_size = game_state.map.board_size;
					this.session.gameState!.map.regionAssignment = game_state.map.regionAssignment;
					this.session.gameState!.map.difficultyLevel = game_state.map.difficultyLevel;
					this.session.gameState!.map.solutionMapping = game_state.map.solutionMapping;
					this.session.gameState!.state.boardState = game_state.state.boardState;
					this.session.gameState!.state.regionColors = game_state.state.regionColors;
					this.session.gameState!.state.moveHistory = game_state.state.moveHistory;
					this.session.gameState!.state.nbHint = game_state.state.nbHint;
				} else {
					await this.loadMapFromDB(row.board_size, row.difficultyLevel);
				}
				return await this.check_game_state(false);
			} else {
				return { status: 'error', message: { message: "Aucune partie trouvée", type: "error" } };
			}
		} catch (err) {
			console.error(err);
			return { status: 'error', message: { message: "Erreur interne", type: "error" } };
		}
	}
}

export { GameSolo };