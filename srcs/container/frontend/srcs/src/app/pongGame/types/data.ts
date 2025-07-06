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

export interface MatchSummary {
	mode: string;
	date: string;
	opponentName: string;
	status: 'Victoire' | 'Défaite' | 'Abandon';
}

export interface StatMode {
		victoire: number;
		defaite: number;
		abandon: number;
		nbParti: number;
		victoirePour100: number;
		defaitePour100: number;
		abandonPour100: number;
}

export interface StatModeTournament {
	total: {
		victoire: number;
		defaite: number;
		abandon: number;
		nbParti: number;
		victoirePour100: number;
		defaitePour100: number;
		abandonPour100: number;
	}
	tournamentVictory: number;
}


export interface userStatsPong {
	total: StatMode;
	tournamentVictory: number;
	Multi: StatMode;
	Tournament: StatMode;
	Solo: StatMode;
	SameKeyboard: SameKeyboardStat;
	lastFive: MatchSummary[];
	ok: boolean,
}

export interface SameKeyboardStat {
	nbParti: number;
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
		statistique: StatModeTournament,
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

