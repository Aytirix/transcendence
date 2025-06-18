import bcrypt from 'bcrypt';
import executeReq from '@models/database';
import { User } from '@types';
import tools from '@tools';

setInterval(async () => {
	try {
		await updateInvalidExpiredCode();
	} catch (error) {
		console.error('Error cleaning up expired verification codes:', error);
	}
}, 15 * 60 * 1000);

export const updateInvalidExpiredCode = async (): Promise<void> => {
	await executeReq('DELETE FROM verification_codes WHERE expires_at < NOW()');
};

export const deleteCode = async (email: string): Promise<void> => {
	await executeReq('DELETE FROM verification_codes WHERE email = ?', [email]);
}

export const createCode = async (email: string, username: string, code: string, expiresAt: Date, type: string, user: User = null): Promise<boolean> => {
	console.log(`Creating verification code: ${code}`);
	const hashedCode = await bcrypt.hash(code, 10);
	console.log(`create hash for code: ${hashedCode}`);
	const encryptedUser = user ? tools.encrypt(JSON.stringify(user)) : null;
	const result: any = await executeReq(
		'INSERT INTO verification_codes (email, username, code, user_json, type, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
		[email, username, hashedCode, encryptedUser, type, expiresAt]
	)
	return result.affectedRows > 0;
};

export const verifyCode = async (email: string, type: string, code: string): Promise<User | null | true> => {
	const result: any = await executeReq('SELECT code, user_json FROM verification_codes WHERE email = ? AND type = ? AND expires_at > NOW()', [email, type]);

	if (result.length === 0) {
		console.warn(`No valid verification code found for email: ${email}`);
		return null;
	}
	const { code: hashedCode, user_json } = result[0];
	const isValid = await bcrypt.compare(code, hashedCode);
	if (!isValid) {
		console.warn(`Invalid verification code for email: ${email}`);
		return null;
	}
	const user: User = user_json ? JSON.parse(tools.decrypt(user_json)) : true;
	await deleteCode(email);
	return user;
};

export default {
	updateInvalidExpiredCode,
	deleteCode,
	createCode,
	verifyCode
};