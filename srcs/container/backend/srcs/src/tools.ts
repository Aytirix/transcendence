import bcrypt from 'bcrypt';
const crypto = require('crypto');
require('dotenv').config();

export async function hashPassword(password: string): Promise<string> {
	try {
		const saltRounds = 10;
		const hash = await bcrypt.hash(password, saltRounds);
		return hash;
	} catch (error) {
		console.error(error);
		throw new Error('Erreur lors du hachage du mot de passe');
	}
}

export function mapToObject<T>(map: Map<number, T>): Record<number, T> {
	const obj: Record<number, T> = {};
	for (const [key, value] of map.entries()) {
		obj[key] = value;
	}
	return obj;
}

export function mapToArray<T>(map: Map<number, T>): T[] {
	return Array.from(map.values());
}

/**
 * Chiffre un texte en utilisant l'algorithme
 * @param {string} text - Le texte à chiffrers
 * @returns {string} - Le texte chiffré en format hexadécimal
 */
export function encrypt(text: string): string {
	const algorithm = process.env.ENCRYPT_ALGORITHM;
	const key = Buffer.from(process.env.ENCRYPT_KEY, 'hex');
	const iv = Buffer.from(process.env.ENCRYPT_IV, 'hex');

	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	return encrypted;
}

/**
 * Déchiffre un texte chiffré avec l'algorithme
 * @param {string} encryptedText - Le texte chiffré en format hexadécimal
 * @returns {string} - Le texte déchiffré
 */
export function decrypt(encryptedText: string): string {
	const algorithm = process.env.ENCRYPT_ALGORITHM;
	const key = Buffer.from(process.env.ENCRYPT_KEY, 'hex');
	const iv = Buffer.from(process.env.ENCRYPT_IV, 'hex');

	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

export default {
	hashPassword,
	mapToObject,
	mapToArray,
	encrypt,
	decrypt,
};