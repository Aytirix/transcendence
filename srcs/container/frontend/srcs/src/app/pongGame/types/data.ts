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

export interface userStatsPong {
	victoire: number,
	defaite: number,
	abandon: number,
	tournamentVictory: number,
	nbParti: number,
	victoirePour100: number,
	defaitePour100: number,
	abandonPour100: number,
	fiveLastMatch: string,
	ok: boolean,
}

export interface Tournament {
	id: number;
	name: string;
	max: number;
	current: number;
	isFull: boolean;
	listPlayers: {
		name: string,
		avatar: string,
	}[];
}

export interface MatchDisplayData {
	totalRound: number;
	totalMatch: number;
	player1: string;
	player1Avatar: string;
	p1ResultMatchTournament?: "Loose" | "Win" | "Current";
	player2: string;
	player2Avatar: string;
	p2ResultMatchTournament?: "Loose" | "Win" | "Current";
}

