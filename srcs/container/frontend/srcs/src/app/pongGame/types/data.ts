export interface Parse {
	ball: {
		pos_x: number;
		pos_y: number;
		d_x: number;
		d_y: number;
		readonly speed: number;
		readonly radius: number;
	};
	player1: {
		pos_x: number;
		pos_y: number;
		userName: string;
		readonly height: number;
		readonly width: number;
		readonly margin: number;
		readonly speed: number;
		score: number;
	};
	player2: {
		pos_x: number;
		pos_y: number;
		userName: string;
		readonly height: number;
		readonly width: number;
		readonly margin: number;
		readonly speed: number;
		score: number;
	};
	camera?: {
		pos_x: number;
		pos_y: number;
		pos_z: number;
		rot_x: number;
		rot_y: number;
	}
}

export interface Tournament {
	size: 4 | 8 | 16 | 32;
	name: string;
	winner?: boolean;
	isFull: boolean;
	idTournament?: number;
	nbPlayer: number;
} [];