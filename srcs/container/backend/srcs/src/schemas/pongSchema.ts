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

export const getStatistics = {
	description: "Récupérer les statistiques d'un joueur.",
	tags: ['pong'],
	response: {
		200: {
			description: 'Statistiques récupérées avec succès',
			type: 'object',
			properties: {
			total: {
				type: 'object',
				properties: {
				victoire: { type: 'number' },
				defaite: { type: 'number' },
				abandon: { type: 'number' },
				nbParti: { type: 'number' },
				victoirePour100: { type: 'number' },
				defaitePour100: { type: 'number' },
				abandonPour100: { type: 'number' },
				}
			},
			tournamentVictory: { type: 'number' },
			Multi: {
				type: 'object',
				properties: {
				victoire: { type: 'number' },
				defaite: { type: 'number' },
				abandon: { type: 'number' },
				nbParti: { type: 'number' },
				victoirePour100: { type: 'number' },
				defaitePour100: { type: 'number' },
				abandonPour100: { type: 'number' },
				}
			},
			Tournament: {
				type: 'object',
				properties: {
				victoire: { type: 'number' },
				defaite: { type: 'number' },
				abandon: { type: 'number' },
				nbParti: { type: 'number' },
				victoirePour100: { type: 'number' },
				defaitePour100: { type: 'number' },
				abandonPour100: { type: 'number' },
				}
			},
			Solo: {
				type: 'object',
				properties: {
				victoire: { type: 'number' },
				defaite: { type: 'number' },
				abandon: { type: 'number' },
				nbParti: { type: 'number' },
				victoirePour100: { type: 'number' },
				defaitePour100: { type: 'number' },
				abandonPour100: { type: 'number' },
				}
			},
			SameKeyboard: {
				type: 'object',
				properties: {
				nbParti: { type: 'number' }
				}
			},
			lastFive: {
				type: 'array',
				items: {
				type: 'object',
				properties: {
					mode: { type: 'string' },
					date: { type: 'string' },
					opponentName: { type: 'string' },
					status: { type: 'string' } // "Victoire", "Défaite", "Abandon"
				},
				required: ['mode', 'date', 'opponentName', 'status']
			}
		}
	},
		additionalProperties: false,
		},
		401: {
			description: 'Erreur d\'authentification',
			...messageResponse,
		}
	},
};

export default {
	invitePlayer,
	getStatistics,
};