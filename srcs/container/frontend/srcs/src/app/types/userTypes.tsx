export type RelationStatus = 'friend' | 'blocked' | 'pending' | '';

export type User = {
	id: number;
	username: string;
	email: string;
	avatar: string | null;
	lang: string;
	twofa?: boolean;
	relation?: {
		status: RelationStatus;
		target: number;
		privmsg_id?: number;
	};
	online?: boolean;
};