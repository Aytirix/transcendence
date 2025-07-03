import { messageResponse } from './common';

export const invitePlayer = {
	description: "Inviter un joueur à rejoindre votre partie de Pong.",
	tags: ['pong'],
	body: {
		type: 'object',
		properties: {
			friendId: { type: 'number', minLength: 1, maxLength: 20},
		},
		required: ['friendId'],
		additionalProperties: false,
		errorMessage: {
			required: {
				friendId: 'pong.invitePlayer.friendId.required',
			},
			properties: {
				friendId: 'pong.invitePlayer.friendId.invalid',
			},
			additionalProperties: 'errors.NoadditionalProperties',
		}
	},
	response: {
		200: {
			description: 'Invitation réussie',
			type: 'object',
			properties: {
				token: { type: 'string' },
			},
			additionalProperties: false,
		},
		400: {
			description: 'Format des données incorrect',
			...messageResponse,
		},
		401: {
			description: 'Erreur d\'authentification',
			...messageResponse,
		},
		403: {
			description: 'Accès refusé',
			...messageResponse,
		},
	},
};

export default {
	invitePlayer,
};