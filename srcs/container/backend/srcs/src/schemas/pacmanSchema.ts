import { messageResponse } from './common';

export default {
	getStatisticsForUser: {
		tags: ['Pacman'],
		summary: 'Obtenir les statistiques Pacman pour l\'utilisateur',
		description: 'Récupérer les statistiques de jeu Pacman pour l\'utilisateur authentifié.',
		response: {
			200: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					stats: {
						type: 'object',
						properties: {
							pacman: {
								type: 'object',
								properties: {
									games_played: { type: 'number', description: 'Nombre total de parties jouées en tant que Pacman' },
									games_won: { type: 'number', description: 'Nombre de parties gagnées en tant que Pacman' },
									games_lost: { type: 'number', description: 'Nombre de parties perdues en tant que Pacman' },
									win_rate: { type: 'number', description: 'Taux de victoire en pourcentage (0-100)' },
									best_score: { type: 'number', description: 'Meilleur score obtenu en tant que Pacman' },
									average_score: { type: 'number', description: 'Score moyen en tant que Pacman' },
								},
								example: {
									games_played: 25,
									games_won: 18,
									games_lost: 7,
									win_rate: 72.0,
									best_score: 12000,
									average_score: 8500
								}
							},
							ghosts: {
								type: 'object',
								properties: {
									games_played: { type: 'number', description: 'Nombre total de parties jouées en tant que Ghost' },
									games_won: { type: 'number', description: 'Nombre de parties gagnées en tant que Ghost' },
									games_lost: { type: 'number', description: 'Nombre de parties perdues en tant que Ghost' },
									win_rate: { type: 'number', description: 'Taux de victoire en pourcentage (0-100)' },
									best_score: { type: 'number', description: 'Meilleur score obtenu en tant que Ghost' },
									average_score: { type: 'number', description: 'Score moyen en tant que Ghost' },
								},
								example: {
									games_played: 30,
									games_won: 22,
									games_lost: 8,
									win_rate: 73.33,
									best_score: 10200,
									average_score: 6800
								}
							},
							record_pacman: {
								type: 'array',
								maxItems: 3,
								items: {
									type: 'object',
									properties: {
										id: { type: 'number', description: 'ID de la statistique' },
										username: { type: 'string', description: 'Nom d\'utilisateur du joueur' },
										score: { type: 'number', description: 'Meilleur score Pacman' },
									},
									example: {
										id: 15,
										username: 'ProPacman',
										score: 12000
									}
								},
								description: 'Top 3 des meilleurs scores Pacman (victoires uniquement)'
							},
							record_ghost: {
								type: 'array',
								maxItems: 3,
								items: {
									type: 'object',
									properties: {
										id: { type: 'number', description: 'ID de la statistique' },
										username: { type: 'string', description: 'Nom d\'utilisateur du joueur' },
										score: { type: 'number', description: 'Meilleur score Ghost' },
									},
									example: {
										id: 28,
										username: 'GhostMaster',
										score: 10200
									}
								},
								description: 'Top 3 des meilleurs scores Ghost (victoires uniquement)'
							},
						},
					},
				},
			},
			400: messageResponse,
			401: messageResponse,
			500: messageResponse,
		},
	},
	getStatisticsForSpecificUser: {
		tags: ['Pacman'],
		summary: 'Obtenir les statistiques Pacman pour un utilisateur spécifique',
		description: 'Récupérer les statistiques de jeu Pacman pour un utilisateur donné par son ID.',
		params: {
			type: 'object',
			properties: {
				userId: { type: 'string', pattern: '^[0-9]+$' }
			},
			required: ['userId'],
			additionalProperties: false,
			errorMessage: {
				required: {
					userId: 'errors.user.userIdRequired',
				},
				properties: {
					userId: 'errors.user.invalidUserId',
				},
			}
		},
		response: {
			200: {
				type: 'object',
				properties: {
					success: { type: 'boolean' },
					stats: {
						type: 'object',
						additionalProperties: true
					},
				},
			},
			400: {
				type: 'object',
				properties: {
					success: { type: 'boolean', const: false },
					message: { type: 'string' },
				},
			},
			401: messageResponse,
			500: messageResponse,
		},
	},
};