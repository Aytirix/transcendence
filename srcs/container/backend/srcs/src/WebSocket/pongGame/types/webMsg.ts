export interface webMsg {
	type:  "Multi"
		| "Solo"
		| "SameKeyboard" 
		| "Tournament" 
		| "Undefined" 
		| "Move" 
		| "EXIT" 
		| "Score"
		| "Name"
		| "Ping";
	action?: "Create"
			| "Join"
			| "Start"
			| "Display"
			| "Winner";
	player1?: number;
	player2?: number;
	sizeTournament?: 4
				| 8
				| 16
				| 32;
	id?: number;
	value?: string; 
};
