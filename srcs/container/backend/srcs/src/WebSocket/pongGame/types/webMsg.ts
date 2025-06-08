export interface webMsg {
	type:  "Multi"
		| "Solo"
		| "SameKeyboard" 
		| "Tournament" 
		| "Undefined" 
		| "Move" 
		| "EXIT" 
		| "Ping";
	action?: "Create"
			| "Join";
	sizeTournament?: 4
				| 8
				| 16
				| 32;
	id?: number;
	value?: string; 
};
