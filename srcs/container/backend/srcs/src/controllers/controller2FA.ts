import { FastifyRequest, FastifyReply } from 'fastify';
import model2FA from '@models/model2FA';
import userModel from '@models/modelUser';
import tools from '@tools';
import i18n from '@i18n';
import { User } from '@types';
import { readFileSync } from 'fs';
import { join } from 'path';
import nodemailer from 'nodemailer';

require('dotenv').config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.GOOGLE_EMAIL,
		pass: process.env.GOOGLE_PASS,
	},
});

/**
 * Fonction générale pour traiter les templates HTML
 * @param templatePath - Chemin vers le fichier template
 * @param replacements - Objet contenant les clés/valeurs à remplacer
 * @returns - Le HTML avec les remplacements effectués
 */
function processTemplate(templatePath: string, replacements: Record<string, string>): string {
	try {
		// Lire le contenu du template
		const templateContent = readFileSync(templatePath, 'utf-8');

		// Remplacer toutes les variables dans le template
		let processedContent = templateContent;

		Object.entries(replacements).forEach(([key, value]) => {
			// Remplace {{key}} par la valeur correspondante
			const regex = new RegExp(`{{${key}}}`, 'g');
			processedContent = processedContent.replace(regex, value);
		});

		return processedContent;
	} catch (error) {
		console.error(`Error processing template ${templatePath}:`, error);
		throw new Error(`Template processing failed: ${error.message}`);
	}
}

/**
 * Fonction générale pour envoyer des emails avec template
 * @param templateName - Nom du fichier template (sans extension)
 * @param to - Email destinataire
 * @param subject - Sujet de l'email
 * @param replacements - Variables à remplacer dans le template
 * @param request - Objet request Fastify pour l'i18n
 */
async function sendTemplateEmail(
	templateName: string,
	to: string,
	subject: string,
	replacements: Record<string, string>,
	request?: FastifyRequest
): Promise<void> {
	const language = request.i18n.language || 'fr';
	console.log(`Sending email using template: ${templateName} in language: ${language}`);
	const templatePath = join(__dirname, '../template_email', language, `${templateName}.html`);

	// Ajouter des variables par défaut si request est fourni
	const defaultReplacements = request ? {

		baseUrl: 'https://localhost:3000',
		siteName: 'Transcendence',
		...replacements
	} : replacements;

	const htmlContent = processTemplate(templatePath, defaultReplacements);

	const mailOptions = {
		from: process.env.GOOGLE_EMAIL,
		to: to,
		subject: subject,
		html: htmlContent
	};
	await transporter.sendMail(mailOptions);
}

export const sendRegisterVerifyEmail = async (request: FastifyRequest, email: string, type: string, user: any): Promise<boolean> => {
	try {
		// Sauvegarder le code en base de données
		const userCode = await createVerificationCode(email, user.username, type, user);
		if (!userCode) return false;

		const encryptedData = tools.encrypt(JSON.stringify({ userCode, email, type, timestamp: Date.now() }));
		// Préparer les variables pour le template
		const templateReplacements = {
			verificationLink: `https://localhost:3000/auth/checkCode?code=${encryptedData}&type=${type}&redirectUrl=/`,
			expiryTime: '15 minutes',
		};

		// Envoyer l'email en utilisant la fonction générale
		await sendTemplateEmail(
			type,
			email,
			request.i18n.t('email.verificationCode.subjectCreateAccount'),
			templateReplacements,
			request
		);

		return true;
	} catch (error) {
		console.error('Error sending verification code:', error);
		return false;
	}
};

export const sendUpdateVerifyEmail = async (request: FastifyRequest, email: string): Promise<boolean> => {
	try {
		const type = 'update_confirm_email';
		// Sauvegarder le code en base de données
		await model2FA.deleteCode(request.session.user.email);
		const userCode = await createVerificationCode(request.session.user.email, null, type, null);
		if (!userCode) return false;

		const encryptedData = tools.encrypt(JSON.stringify({ userCode, email, originalEmail: request.session.user.email, type, timestamp: Date.now() }));
		// Préparer les variables pour le template
		const templateReplacements = {
			verificationLink: `https://localhost:3000/auth/checkCode?code=${encryptedData}&type=${type}`,
			expiryTime: '15 minutes',
		};

		// Envoyer l'email en utilisant la fonction générale
		await sendTemplateEmail(
			type,
			email,
			request.i18n.t('email.verificationCode.subjectUpdateEmail'),
			templateReplacements,
			request
		);

		return true;
	} catch (error) {
		console.error('Error sending verification code:', error);
		return false;
	}
};

export function generateCode() {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let code = '';
	for (let i = 0; i < 100; i++) {
		code += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return code;
}

export async function createVerificationCode(email: string, username: string = null, type: string, user = null): Promise<false | string> {
	const code = generateCode();
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

	const result = await model2FA.createCode(email, username, code, expiresAt, type, user);
	if (!result) {
		return false;
	}
	return code;
}

export async function verifyCode(req: FastifyRequest, reply: FastifyReply) {
	const { code } = req.body as { code: string };
	const json = tools.decrypt(code);
	if (!json) {
		return reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
	}
	const { userCode, email, originalEmail, type } = JSON.parse(json);

	if (!userCode || !email || !type) {
		return reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
	}

	// Vérifier si l'utilisateur est déjà connecté pour certains types
	if (['createAccount_confirm_email'].includes(type) && req.session.user) {
		return reply.status(400).send({ success: false, message: i18n.t('login.alreadyLoggedIn') });
	} else if (['update_confirm_email'].includes(type)) {
		if (!req.session.user) return reply.status(400).send({ success: false, message: i18n.t('login.notLoggedIn') });

		if (originalEmail && originalEmail !== req.session.user.email) {
			return reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
		}
	}

	const isValid = await model2FA.verifyCode(originalEmail || email, type, userCode);

	if (!isValid) {
		return reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
	}

	if (isValid){
		if (type == 'createAccount_confirm_email' && typeof isValid === 'object') {
			const user = await userModel.Register(isValid.email, isValid.username, isValid.password, isValid.avatar, isValid.lang);
			req.session.user = user;
			return reply.status(200).send({ success: true, message: i18n.t('email.verificationCode.CreateAccountOk'), user });
		} else if (type == 'update_confirm_email') {
			await userModel.UpdateUser(req.session.user.id.toString(), email);
			req.session.user.email = email;
			return reply.status(200).send({ success: true, message: i18n.t('email.verificationCode.UpdateEmailOk') });
		} else if (type == 'loginAccount_confirm_email' && typeof isValid === 'object') {
			req.session.user = isValid as User;
			return reply.status(200).send({ success: true, message: i18n.t('email.verificationCode.LoginAccountOk'), isValid });
		}
	}
	return reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
}

export default {
	generateCode,
	createVerificationCode,
	verifyCode,
	sendRegisterVerifyEmail,
	sendUpdateVerifyEmail,
	processTemplate,
	sendTemplateEmail
};