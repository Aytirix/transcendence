import { WebSocket } from 'ws';

export interface sessionPayload {
	userAgent: string;
}

export interface User {
	id: number;
	email?: string;
	username: string;
	password?: string;
	lang?: string;
	google_token?: string;
	avatar?: string;
	twofa?: boolean;
	privmsg_id?: number;
	online?: boolean;
	relation?: {
		status: 'friend' | 'blocked' | 'pending' | '';
		target: number;
		privmsg_id?: number;
	}
}

export interface MinecraftUser {
	_eaglercraftX_g: string;
	_eaglercraftX_p: string;
	_eaglercraftX_r: string;
	lastMinecraftAccess: number;
	resourcePacks: any[];
	worlds: any[];
}

export interface Message {
	id: number;
	sender_id?: number;
	message: string;
	sent_at: Date;
}

export interface Group {
	id: number;
	name: string;
	members: User[];
	owners_id: number[];
	onlines_id: number[];
	messages: Map<number, Message>;
	private: boolean;
}

export interface Friends {
	id: number;
	user_one_id: number;
	user_two_id: number;
	target: number;
	group_id: number;
	status: 'friend' | 'blocked' | 'pending' | '';
}