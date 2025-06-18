import { FastifyRequest, FastifyReply } from 'fastify';
import userModel from '@models/modelUser';
import controller2FA from '@controllers/controller2FA';
import tools from '@tools';
import i18n from '@i18n';
import { IdentityPoolClient, OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import { User } from '@types';

require('dotenv').config();

const Auth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const Login = async (request: FastifyRequest, reply: FastifyReply) => {
	const { email, password } = request.body as { email: string; password: string };

	const user = await userModel.Login(email, password);


	if (user === false) {
		return reply.status(401).send({
			message: request.i18n.t('login.passwordNotSet'),
		});
	}

	if (user === null) {
		return reply.status(401).send({
			message: request.i18n.t('login.failed'),
		});
	}

	request.session.user = user;

	return reply.send({
		message: request.i18n.t('login.welcome'),
	});
};

export const Register = async (request: FastifyRequest, reply: FastifyReply) => {
	const { email, username, password, confirmPassword, lang } = request.body as { email: string; username: string, password: string, confirmPassword: string, lang: string };

	if (await userModel.emailAlreadyExists(email)) {
		return reply.status(409).send({
			message: request.i18n.t('errors.email.alreadyExists'),
		});
	}

	if (username.startsWith('PacmanAI') || await userModel.usernameAlreadyExists(username)) {
		return reply.status(409).send({
			message: request.i18n.t('errors.username.alreadyExists'),
		});
	}

	if (password !== confirmPassword) {
		return reply.status(400).send({
			message: request.i18n.t('errors.password.notMatching'),
		});
	}

	const defaultAvatar = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'][Math.floor(Math.random() * 4)];

	const user = {
		email,
		username,
		password,
		lang: lang || 'fr',
		avatar: defaultAvatar,
	}
	controller2FA.createVerifyEmailAccount(request, email, user);

	return reply.send({
		message: request.i18n.t('login.welcome'),
	});
};

export const UpdateUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as {
		email: string | null;
		username: string | null;
		password: string | null;
		confirmPassword: string | null;
		lang: string | null;
		avatar: string | null;
	};

	const email = body.email || null;
	const username = body.username || null;
	const password = body.password || null;
	const confirmPassword = body.confirmPassword || null;
	const lang = body.lang || null;
	const avatar = body.avatar || null;

	if (!email && !username && !password && !confirmPassword && !lang && !avatar) {
		return reply.status(400).send({
			message: request.i18n.t('errors.user.noChanges'),
		});
	}

	const user = request.session.user;

	if (email && email !== user.email && await userModel.emailAlreadyExists(email)) {
		return reply.status(409).send({
			message: request.i18n.t('errors.email.alreadyExists'),
		});
	}

	if (username && username !== user.username && (username.startsWith('PacmanAI') || await userModel.usernameAlreadyExists(username))) {
		return reply.status(409).send({
			message: request.i18n.t('errors.username.alreadyExists'),
		});
	}

	if (password !== confirmPassword) {
		return reply.status(400).send({
			message: request.i18n.t('errors.password.notMatching'),
		});
	}

	if (lang && lang !== user.lang) {
		request.i18n.changeLanguage(lang);
	}

	if (avatar && !['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'].includes(avatar)) {
		return reply.status(400).send({
			message: request.i18n.t('user.file.invalidname'),
		});
	}

	if (avatar && request.session.user.avatar && !['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'].includes(request.session.user.avatar)) {
		const avatarPath = path.join(__dirname, '..', '..', 'uploads', request.session.user.avatar);
		if (fs.existsSync(avatarPath)) {
			fs.unlinkSync(avatarPath);
		}
	}

	await userModel.UpdateUser(user.id.toString(), email, username, password, lang, avatar);
	request.session.user = {
		...user,
		email: email || user.email,
		username: username || user.username,
		lang: lang || user.lang,
		avatar: avatar || user.avatar,
	};

	return reply.send({
		message: `Vos informations ont été mises à jour avec succès.`,
		user: {
			id: request.session.user.id,
			email: request.session.user.email,
			username: request.session.user.username,
			lang: request.session.user.lang,
			avatar: request.session.user.avatar || null,
		},
	});
}

export const Logout = async (request: FastifyRequest, reply: FastifyReply, msg: boolean = true) => {
	await request.session.destroy();
	if (msg) {
		return reply.send({
			message: request.i18n.t('login.logout'),
		});
	}
};

export async function authGoogleCallback(request: FastifyRequest, reply: FastifyReply) {
	const { jwt } = request.body as { jwt: string };
	try {
		const ticket = await Auth2Client.verifyIdToken({
			idToken: jwt,
			audience: process.env.GOOGLE_CLIENT_ID
		});
		const payload = ticket.getPayload();
		if (!payload) {
			return reply.status(401).send({
				isAuthenticated: false,
				user: null,
				message: request.i18n.t('login.invalidJwt'),
			});
		}

		if (!payload['sub'] || !payload['email']) {
			return reply.status(401).send({
				isAuthenticated: false,
				user: null,
				message: request.i18n.t('login.missingPayloadData'),
			});
		}

		let user = await userModel.getUserByGoogleToken(payload['sub']);
		if (user) {
			request.session.user = user;
			return reply.status(200).send({
				isAuthenticated: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					lang: user.lang,
					avatar: user.avatar,
				},
			});
		}

		user = {
			id: 0,
			email: payload['email'],
			username: payload['name'].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10) || payload['email'].split('@')[0].toLowerCase().slice(0, 10),
			lang: 'fr',
			avatar: payload['picture'] || ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'][Math.floor(Math.random() * 4)],
		};

		let addnum = 0;
		let maxAttempts: number = 100;
		while (maxAttempts-- > 0) {
			if (await userModel.usernameAlreadyExists(user.username)) {
				user.username += Math.floor(Math.random() * 10);
				addnum++;
				if (user.username.length > 15) {
					user.username = user.username.slice(0, 15 - addnum.toString().length);
				}
			}
			else break;
		}
		if (maxAttempts <= 0) {
			return reply.status(500).send({
				isAuthenticated: false,
				user: null,
				message: request.i18n.t('login.usernameGenerationFailed'),
			});
		}

		const userExist = await userModel.getUserByEmail(payload['email']);
		if (userExist) {
			user.id = userExist.id;
			await userModel.addRelationGoogleToken(userExist.id, payload['sub']);
		} else {
			user = await userModel.Register(user.email, user.username, null, user.avatar, user.lang);
			await userModel.addRelationGoogleToken(user.id, payload['sub']);
		}

		request.session.user = user;
		return reply.status(200).send({
			isAuthenticated: true,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				lang: user.lang,
				avatar: user.avatar || null,
			},
		});
	} catch (error) {
		console.error('Google authentication error:', error);
		return reply.status(401).send({
			isAuthenticated: false,
			user: null,
			message: request.i18n.t('login.googleAuthFailed'),
		});
	}
}

export const UploadAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
	// Gérer les requêtes OPTIONS (preflight)
	if (request.method === 'OPTIONS') {
		return reply
			.code(200)
			.header('Access-Control-Allow-Origin', request.headers.origin || '*')
			.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
			.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
			.header('Access-Control-Allow-Credentials', 'true')
			.send();
	}

	const file = await request.file();

	if (!file) {
		return reply.code(400).send({ success: false, message: request.i18n.t('user.file.missing') });
	}

	// Vérifier que le fichier a un nom
	if (!file.filename) {
		return reply.code(400).send({ success: false, message: request.i18n.t('user.file.invalidname') });
	}

	// Taille maximum (multi-part gère l'arrêt, mais on vérifie)
	if (file.file.truncated) {
		return reply.code(413).send({ success: false, message: request.i18n.t('user.file.tooLarge') });
	}

	// Contrôle du format
	const ALLOWED_MIME = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
	if (!ALLOWED_MIME.includes(file.mimetype)) {
		return reply.code(400).send({ success: false, message: request.i18n.t('user.file.invalidFormat') });
	}

	const pipelineAsync = promisify(pipeline);

	const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads");

	const fileExtension = path.extname(file.filename);
	const safeFilename = `profile_${request.session.user.id}.jpg`;
	const safeFilePath = path.join(AVATAR_DIR, safeFilename);

	try {
		await pipelineAsync(file.file, fs.createWriteStream(safeFilePath));
		await userModel.UpdateUser(request.session.user.id.toString(), null, null, null, null, safeFilename);
		request.session.user.avatar = safeFilename;
		return reply.code(200).send({
			success: true,
			url: `/avatars/${safeFilename}`,
			fileName: safeFilename,
		});
	} catch (error) {
		console.error('Error processing file upload:', error);
		return reply.code(500).send({ success: false, message: request.i18n.t('user.file.uploadError') });
	}
}

export default {
	Login,
	Register,
	UpdateUser,
	Logout,
	authGoogleCallback,
	UploadAvatar
};