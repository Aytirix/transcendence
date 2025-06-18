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
	const templatePath = join(__dirname, '../template_email', `${templateName}.html`);

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

export const createVerifyEmailAccount = async (request: FastifyRequest, email: string, user: any): Promise<boolean> => {
	try {
		// Sauvegarder le code en base de données
		const userCode = await createVerificationCode(email, user.username, 'confirm_email', user);
		if (!userCode) return false;

		const encryptedData = tools.encrypt(JSON.stringify({ userCode, email, type: 'confirm_email' }));
		// Préparer les variables pour le template
		const templateReplacements = {
			verificationLink: `https://localhost:3000/auth/confirmEmail?code=${encryptedData}`,
			expiryTime: '15 minutes',
		};

		// Envoyer l'email en utilisant la fonction générale
		await sendTemplateEmail(
			'confirm_email', // nom du template
			email,
			request.i18n.t('email.verificationCode.subject'),
			templateReplacements,
			request
		);

		return true;
	} catch (error) {
		console.error('Error sending verification code:', error);
		return false;
	}
};

// Fonction pour envoyer un email de réinitialisation de mot de passe
export const SendPasswordResetEmail = async (email: string, resetToken: string, request?: FastifyRequest) => {
	try {
		const templateReplacements = {
			resetLink: `${process.env.BASE_URL}/reset-password?token=${resetToken}`,
			expiryTime: '30 minutes',
			supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER
		};

		await sendTemplateEmail(
			'password_reset',
			email,
			request?.i18n.t('email.passwordReset.subject') || 'Réinitialisation de mot de passe',
			templateReplacements,
			request
		);
	} catch (error) {
		console.error('Error sending password reset email:', error);
		throw error;
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

export async function createVerificationCode(email: string, username: string, type: string, user = null): Promise<false | string> {
	const code = generateCode();
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

	const result = await model2FA.createCode(email, username, code, expiresAt, type, user);
	if (!result) {
		return false;
	}
	return code;
}

export async function verifyCodeRegister(req: FastifyRequest, reply: FastifyReply) {
	const { code } = req.body as { code: string };
	const json = tools.decrypt(code);
	if (!json) {
		reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
		return;
	}
	const { userCode, email } = JSON.parse(json);

	if (!userCode || !email) {
		reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
		return;
	}

	// Vérifier le code en base de données
	const isValid = await model2FA.verifyCode(email, "confirm_email", userCode);

	if (!isValid) {
		reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
		return;
	}

	// Si isValid est un objet, alos c'est une inscription utilisateur
	if (typeof isValid === 'object' && isValid !== null) {
		const user = await userModel.Register(isValid.email, isValid.username, isValid.password, isValid.avatar, isValid.lang);
		console.log(`User registered: ${JSON.stringify(user)}`);
		req.session.user = user;
		reply.send({ success: true, message: i18n.t('email.verificationCode.CreateAccountOk'), user });
		return;
	}
	reply.status(400).send({ success: false, message: i18n.t('errors.code.invalid') });
}

export default {
	generateCode,
	createVerificationCode,
	verifyCodeRegister,
	createVerifyEmailAccount,
	SendPasswordResetEmail,
	processTemplate,
	sendTemplateEmail
};