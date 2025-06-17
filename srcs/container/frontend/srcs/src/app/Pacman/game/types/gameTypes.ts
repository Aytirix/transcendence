// Types pour les images de jeu
export interface DirectionalImages {
	right: string;
	left: string;
	up: string;
	down: string;
}

export interface GhostImages {
	B: DirectionalImages;
	Y: DirectionalImages;
	I: DirectionalImages;
	C: DirectionalImages;
	eyes: DirectionalImages;
	frightened: string;
	blinking: string;
}

export interface PacmanImages {
	right: string;
	left: string;
	up: string;
	down: string;
	death: string;
	default: string;
}

// Extension du type player pour inclure les propriétés de jeu
export interface GamePlayer {
	id: number;
	username: string;
	character: string;
	position?: {
		x: number;
		y: number;
	};
	score?: number;
	direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
	returnToSpawn?: boolean;
	isFrightened?: boolean;
	isDying?: boolean;
}
