import { messageResponse } from './common';

export const getMap = {
	description: 'récupérer les maps de l\'utilisateur',
	tags: ['Pacman'],
	response: {
		200: {
			description: 'Récuprer les maps de l\'utilisateur',
			type: 'object',
			properties: {
				maps: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							user_id: { type: 'string' },
							name: { type: 'string' },
							map: { type: 'array', items: { type: 'string' } },
							is_public: { type: 'boolean' },
							is_valid: { type: 'boolean' },
							updated_at: { type: 'string', format: 'date-time' },
							created_at: { type: 'string', format: 'date-time' },
						}
					}
				}
			},
		}
	},
}

export const insertOrUpdateMap = {
	tags: ['Pacman'],
	description: 'Insérer ou mettre à jour une map pour l\'utilisateur. Si l\'ID est fourni, la map sera mise à jour, sinon elle sera insérée.',
	body: {
		type: 'object',
		properties: {
			id: { type: 'number', nullable: true },
			name: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9 _-]+$' },
			map: {
				type: 'array',
				minItems: 31,
				maxItems: 31,
				items: {
					type: 'string',
					minLength: 29,
					maxLength: 29,
					pattern: '^[#ToPBICY\\-\\. ]+$'
				}
			},
			is_public: { type: 'number', enum: [0, 1] },
		},
		required: ['name', 'map', 'is_public'],
		errorMessage: {
			required: {
				name: 'pacman.error.name.required',
				map: 'pacman.error.map.required',
				is_public: 'pacman.error.is_public.required',
			},
			properties: {
				name: 'pacman.error.name.invalid',
				is_public: 'pacman.error.is_public.invalid',
			}
		}
	},

	response: {
		200: {
			description: 'Map insérée ou mise à jour avec succès',
			type: 'object',
			properties: {
				id: { type: 'number' },
				is_valid: { type: 'boolean' },
				errors: {
					type: 'array',
					items: {
						type: 'string'
					}
				},
			},
			required: ['id', 'is_valid', 'errors'],
		},
		404: {
			description: 'Map non trouvée pour l\'ID fourni',
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
			required: ['message'],
		},
		500: {
			description: 'Erreur lors de l\'insertion ou de la mise à jour de la map',
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
			required: ['message'],
		},
	},
}


export default {
	getMap,
	insertOrUpdateMap,
};