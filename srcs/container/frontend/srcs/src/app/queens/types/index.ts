// Types et interfaces pour le jeu Queens

export interface GameSettings {
	board_size: number;
	difficultyLevel: number;
	autoCross: boolean;
}

export interface GameMap {
	id: number | null;
	board_size: number | null;
	regionAssignment: number[][] | null;
	difficultyLevel: number | null;
	solutionMapping: Array<[number, number]> | null;
}

export interface GameState {
	boardState: number[][] | null;
	regionColors: string[] | null;
	moveHistory: Array<Array<{ row: number; col: number; from: number; to: number }>> | null;
	nbHint: number | null;
}

export interface Game {
	setting: GameSettings;
	map: GameMap;
	state: GameState;
}

export interface NotificationMessage {
	message: string;
	type: 'success' | 'error' | 'info' | 'warning' | 'victory' | '';
}

export interface WebSocketMessage {
	action: string;
	status?: 'success' | 'error';
	game?: Game;
	message?: NotificationMessage;
	row?: number;
	col?: number;
	newState?: number;
	board_size?: number;
	difficultyLevel?: number;
	autoCross?: boolean;
}

export interface UpdateParameters {
	board_size?: number;
	difficultyLevel?: number;
	autoCross?: boolean;
}

export interface SoloGameHook {
	game: Game | null;
	newGame: () => void;
	makeMove: (row: number, col: number, newState: number) => void;
	undoMove: () => void;
	hint: () => void;
	solution: () => void;
	updateParameters: (newParams: UpdateParameters) => void;
	notification: NotificationMessage;
}

export interface BoardProps {
	game: Game;
	makeMove: (row: number, col: number, newState: number) => void;
}

export interface MenuProps {
	game: Game | null;
	updateParameters: (newParams: UpdateParameters) => void;
}
