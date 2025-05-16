import { messageResponse } from './common';

export const getElo = {
	description: 'Vérification de l\'authentification. Appeler depuis le frontend pour savoir si l\'utilisateur est connecté.',
	tags: ['Pacman'],
	response: {
		200: {
			description: 'Récuprer l\'elo de l\'utilisateur',
			type: 'object',
			properties: {
				elo: { type: 'number' },
			},
			required: ['elo'],
		}
	},
}

export default {
	getElo,
};