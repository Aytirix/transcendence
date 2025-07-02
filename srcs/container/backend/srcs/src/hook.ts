import { FastifyInstance } from 'fastify';
import { Logout } from '@controllers/controllerUser';
import i18n from './i18n';

export function createi18nObject(session: any, headers: any): typeof i18n {
	let lang = '';
	if (session && session.user) {
		lang = session.user.lang;
	} else if (headers['accept-language']) {
		lang = headers['accept-language'];
	}
	lang = lang.split(',')[0].split('-')[0];
	lang = lang.toLowerCase().trim();
	if (lang !== 'fr' && lang !== 'en' && lang !== 'it' && lang !== 'es') {
		lang = 'fr';
	}
	return i18n.cloneInstance({ lng: lang, fallbackLng: 'fr' });
}

export async function registerHook(app: FastifyInstance) {

	app.addHook('preHandler', async (request, reply) => {
		request.i18n = createi18nObject(request.session, request.headers);
	});

	app.setErrorHandler(async (error, request, reply) => {
		// Si l'erreur est une erreur de validation, on renvoie un message d'erreur
		// avec la bonne traduction
		if (error.validation && !reply.sent) {
			const messages = error.validation.map(err => {
				const code = err.message;
				return request.i18n.t(code);
			});

			const validMessages = messages.filter(msg => msg !== '');
			return reply.status(400).send({
				message: validMessages.join(" | ")
			});
		}

		if (!reply.sent) {
			console.error(error);
			reply.status(error.statusCode || 500).send({
				message: error.message
			});
		}
	});

	// Si une session n'a aucune information, on la détruit pour ne pas la stocker dans la base de données
	app.addHook('onSend', async (request, reply, payload) => {
		if (request.session && Object.keys(request.session).length === 1) {
			Logout(request, reply, false);
		}
	});
}