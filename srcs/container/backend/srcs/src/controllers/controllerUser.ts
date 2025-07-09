import { FastifyRequest, FastifyReply } from 'fastify';
import userModel from '@models/modelUser';
import controller2FA from '@controllers/controller2FA';
import tools from '@tools';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";
import { WebSocket } from 'ws';
import { setLangSocketsForUser } from '../WebSocket/wsInit';

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

	request.i18n.changeLanguage(user.lang || 'fr');

	if (process.env.NODE_PROJET === 'dev' || request.session.user.twofa == false) request.session.user = user;
	else controller2FA.sendRegisterVerifyEmail(request, user.email, "loginAccount_confirm_email", user);

	return reply.send({
		message: request.i18n.t('login.welcome'),
		redirect: process.env.NODE_PROJET === 'dev' ? '/' : null,
	});
};

export const Register = async (request: FastifyRequest, reply: FastifyReply) => {
	const { email, username, password, confirmPassword, lang } = request.body as { email: string; username: string, password: string, confirmPassword: string, lang: string };

	if (await userModel.emailAlreadyExists(email)) {
		return reply.status(409).send({
			message: request.i18n.t('errors.email.alreadyExists'),
		});
	}

	if ((process.env.NODE_PROJET !== 'dev' && username.startsWith('PacmanAI')) || await userModel.usernameAlreadyExists(username)) {
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

	request.i18n.changeLanguage(lang);

	if (process.env.NODE_PROJET === 'dev') {
		const tmp = await userModel.Register(email, username, password, defaultAvatar, lang);
		request.session.user = tmp;
	} else {
		const user = {
			email,
			username,
			password: await tools.hashPassword(password),
			lang: lang || 'fr',
			avatar: defaultAvatar,
		};
		controller2FA.sendRegisterVerifyEmail(request, email, "createAccount_confirm_email", user);
	}

	return reply.send({
		message: request.i18n.t('login.welcome'),
		redirect: process.env.NODE_PROJET === 'dev' ? '/' : null,
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
		twofa: boolean | null;
	};

	const email = body.email || null;
	const username = body.username || null;
	const password = body.password || null;
	const confirmPassword = body.confirmPassword || null;
	const lang = body.lang || null;
	const avatar = body.avatar || null;
	let twofa = body.twofa;
	if (twofa !== false && twofa !== true) twofa = null;
	console.log(`Updating 2fa ${twofa}`);

	if (!email && !username && !password && !confirmPassword && !lang && !avatar && twofa === null) {
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

	if (email && email !== user.email) {
		console.log(`User ${user.id} updated email from ${user.email} to ${email}`);
		await controller2FA.sendUpdateVerifyEmail(request, email);
	}

	await userModel.UpdateUser(user.id.toString(), null, username, password, lang, avatar, twofa);
	request.session.user = {
		...user,
		username: username || user.username,
		lang: lang || user.lang,
		avatar: avatar || user.avatar,
		twofa: twofa !== null ? twofa : user.twofa,
	};

	setLangSocketsForUser(user.id, lang);

	return reply.send({
		message: request.i18n.t('user.updateSuccess'),
		user: {
			id: request.session.user.id,
			email: request.session.user.email,
			username: request.session.user.username,
			lang: request.session.user.lang,
			avatar: request.session.user.avatar || null,
			twofa: request.session.user.twofa || false,
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

		user = await userModel.getUserByEmail(payload['email']);
		if (user) {
			user.id = user.id;
			await userModel.addRelationGoogleToken(user.id, payload['sub']);
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
		}

		user = {
			id: 0,
			email: payload['email'],
			username: payload['name'].replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').toLowerCase().slice(0, 10) || payload['email'].split('@')[0].toLowerCase().slice(0, 10),
			lang: 'fr',
			avatar: ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png'][Math.floor(Math.random() * 4)],
		};

		if (payload['picture']) {
			try {
				const res = await fetch(payload['picture']);
				if (res.ok) {
					const buffer = await res.arrayBuffer();
					const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads");
					if (!fs.existsSync(AVATAR_DIR)) {
						fs.mkdirSync(AVATAR_DIR, { recursive: true });
					}
					const avatarFilename = `profile_${payload['sub']}.jpg`;
					const avatarPath = path.join(AVATAR_DIR, avatarFilename);
					fs.writeFileSync(avatarPath, Buffer.from(buffer));
					user.avatar = avatarFilename;
				}
			} catch (err) {
				console.error('Failed to download Google avatar:', err);
			}
		}

		let addnum = 0;
		let maxAttempts: number = 100;
		while (maxAttempts-- > 0) {
			if (await userModel.usernameAlreadyExists(user.username)) {
				user.username += Math.floor(Math.random() * 10);
				addnum++;
				if (user.username.length > 7) {
					user.username = user.username.slice(0, 7 - addnum.toString().length);
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

		user = await userModel.Register(user.email, user.username, null, user.avatar, user.lang);
		await userModel.addRelationGoogleToken(user.id, payload['sub']);

		if (payload['picture']) {
			const AVATAR_DIR = path.join(__dirname, "..", "..", "uploads");
			const oldAvatarPath = path.join(AVATAR_DIR, `profile_${payload['sub']}.jpg`);
			const newAvatarPath = path.join(AVATAR_DIR, `profile_${user.id}.jpg`);
			if (fs.existsSync(oldAvatarPath)) {
				fs.renameSync(oldAvatarPath, newAvatarPath);
			}
			user.avatar = `profile_${user.id}.jpg`;
			await userModel.UpdateUser(user.id.toString(), null, null, null, null, user.avatar);
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

export const ForgetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
	const { email } = request.body as { email: string };
	const user = await userModel.getUserByEmail(email);
	if (user) {
		user.email = email;
		request.i18n.changeLanguage(user.lang);
		await controller2FA.sendForgotPassword(request, user);
	}
	return reply.status(200).send({
		message: request.i18n.t('email.verificationCode.forgetPassword'),
	});
}

export default {
	Login,
	Register,
	UpdateUser,
	Logout,
	authGoogleCallback,
	UploadAvatar,
	ForgetPassword,
};