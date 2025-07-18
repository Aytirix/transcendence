import bcrypt from 'bcrypt';
import executeReq from '@models/database';
import { MinecraftUser, User } from '@types';
import tools from '@tools';

export const Login = async (email: string, password: string): Promise<User | null | false> => {
	const result = await executeReq('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1', [email, email]) as User[];
	if (result.length === 0) {
		return null;
	}

	const user = result[0];

	if (!user.password) {
		return false;
	}

	// Vérifier si le mot de passe est correct
	if (!(await bcrypt.compare(password, user.password))) {
		return null;
	}

	return {
		id: user.id,
		username: user.username,
		email: user.email,
		avatar: user.avatar,
		lang: user.lang,
		twofa: user.twofa
	};
};

export const Register = async (email: string, username: string, password: string, avatar: string, lang: string, isHashed: boolean = false): Promise<User> => {
	let hashedPassword = null;
	if (password) {
		hashedPassword = isHashed ? password : await tools.hashPassword(password);
	}

	const result: any = await executeReq(
		'INSERT INTO users (email, username, password, avatar, lang) VALUES (?, ?, ?, ?, ?)',
		[email, username, hashedPassword, avatar, lang],
	);
	if (result.affectedRows === 0) {
		throw new Error('Failed to register user');
	}
	return {
		id: result.insertId,
		username,
		email,
		avatar,
		lang,
		twofa: false,
	};
};

export const emailAlreadyExists = async (email: string): Promise<boolean> => {
	const result: any = await executeReq('SELECT email FROM users WHERE email = ? UNION SELECT email FROM verification_codes WHERE email = ? LIMIT 1', [email, email]);
	if (result.length === 0) {
		return false;
	}
	return true;
};

export const usernameAlreadyExists = async (username: string): Promise<boolean> => {
	const result: any = await executeReq('SELECT username FROM users WHERE username = ? UNION SELECT username FROM verification_codes WHERE username = ? LIMIT 1', [username, username]);
	if (result.length === 0) {
		return false;
	}
	return true;
};

export const UpdateUser = async (id: string, email: string = null, username: string = null, password: string = null, lang: string = null, avatar: string = null, twofa: boolean | null = null): Promise<void> => {
	const updates: string[] = [];
	const params: (string | null)[] = [];

	if (email) {
		updates.push('email = ?');
		params.push(email);
	}

	if (username) {
		updates.push('username = ?');
		params.push(username);
	}

	if (password) {
		const hashedPassword = await tools.hashPassword(password);
		updates.push('password = ?');
		params.push(hashedPassword);
	}

	if (lang) {
		updates.push('lang = ?');
		params.push(lang);
	}

	if (avatar) {
		updates.push('avatar = ?');
		params.push(avatar);
	}

	if (twofa !== null) {
		updates.push('twofa = ?');
		params.push((twofa ? 1 : 0).toString());
	}

	params.push(id);

	await executeReq(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
};

export const getUserById = async (id: number): Promise<User | null> => {
	const result: any = await executeReq('SELECT * FROM users WHERE id = ?', [id]);
	if (result.length === 0) {
		return null;
	}
	return {
		id: result[0].id,
		username: result[0].username,
		avatar: result[0].avatar,
		lang: result[0].lang,
	};
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
	const result: any = await executeReq('SELECT * FROM users WHERE email = ?', [email]);
	if (result.length === 0) {
		return null;
	}
	return {
		id: result[0].id,
		username: result[0].username,
		avatar: result[0].avatar,
		lang: result[0].lang,
	};
};

export const getUserByGoogleToken = async (token: string): Promise<User | null> => {
	const result: any = await executeReq('SELECT * FROM users WHERE google_token = ?', [token]);
	if (result.length === 0) {
		return null;
	}
	return {
		id: result[0].id,
		username: result[0].username,
		email: result[0].email,
		avatar: result[0].avatar,
		lang: result[0].lang,
	};
};

export const addRelationGoogleToken = async (id: number, token: string): Promise<void> => {
	await executeReq('UPDATE users SET google_token = ? WHERE id = ?', [token, id]);
	if (token) {
		await executeReq('UPDATE users SET google_token = NULL WHERE id != ?', [id]);
	}
};

export const searchUser = async (name: string): Promise<User[]> => {
	const result: any = await executeReq('SELECT * FROM users WHERE username LIKE ? LIMIT 25', [`%${name}%`]);
	if (result.length === 0) {
		return [];
	}
	const users: User[] = [];
	for (const user of result) {
		users.push({
			id: user.id,
			username: user.username,
			avatar: user.avatar,
			lang: user.lang,
		});
	}
	return users;
};

export default {
	Login,
	Register,
	emailAlreadyExists,
	usernameAlreadyExists,
	UpdateUser,
	getUserById,
	getUserByEmail,
	getUserByGoogleToken,
	addRelationGoogleToken,
	searchUser,
};