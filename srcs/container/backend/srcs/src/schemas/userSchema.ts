import { messageResponse } from './common';

export const login = {
	description: "Connexion utilisateur. Tant qu'il a un cookie sessionId coté client, il peut être considéré comme connecté.",
	tags: ['Authentification'],
	body: {
		type: 'object',
		properties: {
			email: { type: 'string', minLength: 3, maxLength: 50 },
			password: { type: 'string', minLength: 3 },
			// password: { type: 'string', minLength: 8, maxLength: 25, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,25}$' },
		},
		required: ['email', 'password'],
		additionalProperties: false,
		errorMessage: {
			required: {
				email: 'login.failed',
				password: 'login.failed',
			},
			properties: {
				email: 'errors.email.invalid',
				password: 'errors.password.invalid',
			},
			additionalProperties: 'errors.NoadditionalProperties',
		}
	},
	response: {
		200: {
			description: 'Authentification réussie',
			...messageResponse,
		},
		400: {
			description: 'Format des données incorrect',
			...messageResponse,
		},
		401: {
			description: 'Erreur d\'authentification',
			...messageResponse,
		},
	},
};

export const register = {
	...login,
	description: 'Inscription utilisateur',
	tags: ['Authentification'],
	body: {
		properties: {
			...login.body.properties,
			email: { type: 'string', minLength: 3, maxLength: 50, format: 'email' },
			username: { type: 'string', minLength: 3, maxLength: 15, pattern: '^[a-zA-Z0-9]+$' },
			confirmPassword: { type: 'string', minLength: 3 },
			// confirmPassword: { type: 'string', minLength: 8, maxLength: 25, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,25}$' },
			lang: { type: 'string', enum: ['fr', 'en', 'it'] },
		},
		required: [...login.body.required, 'username', 'confirmPassword'],
		errorMessage: {
			required: {
				email: 'errors.email.required',
				password: 'errors.password.required',
				username: 'errors.username.required',
				confirmPassword: 'errors.password.required',
				lang: 'errors.lang.required',
			},
			properties: {
				...login.body.errorMessage.properties,
				username: 'errors.username.invalid',
				confirmPassword: 'errors.password.invalid',
				lang: 'errors.lang.invalid',
			},
		}
	},
}

export const update = {
	...register,
	description: 'Mise à jour utilisateur. Aucun champ n\'est requis, mais au moins un doit être présent.',
	tags: ['user'],
	body: {
		properties: {
			...register.body.properties,
		},
		required: [],
		errorMessage: {
			properties: {
				...register.body.errorMessage.properties,
			},
		}
	},
	response: {
		200: {
			description: 'Mise à jour réussie',
			type: 'object',
			properties: {
				message: { type: 'string' },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number', minLength: 3, maxLength: 5 },
						email: { type: 'string', format: 'email' },
						username: { type: 'string', minLength: 3, maxLength: 15, pattern: '^[a-zA-Z0-9]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it'] },
						avatar: { type: 'string' },
					},
					required: ['id', 'email', 'username', 'lang', 'avatar'],
				},
			},
			required: ['user'],
		},
		400: {
			description: 'Format des données incorrect',
			...messageResponse,
		},
		409: {
			description: 'Conflit de données (email ou nom d\'utilisateur déjà utilisé)',
			...messageResponse,
		},
	},
}

export const logout = {
	description: 'Déconnexion utilisateur',
	tags: ['Authentification'],
	response: {
		200: {
			description: 'Déconnexion réussie',
			...messageResponse,
		}
	},
}


export const isAuth = {
	description: 'Vérification de l\'authentification. Appeler depuis le frontend pour savoir si l\'utilisateur est connecté.',
	tags: ['Authentification'],
	response: {
		200: {
			description: 'Utilisateur authentifié',
			type: 'object',
			properties: {
				isAuthenticated: { type: 'boolean', const: true },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number', minLength: 3, maxLength: 5 },
						email: { type: 'string', format: 'email' },
						username: { type: 'string', minLength: 3, maxLength: 15, pattern: '^[a-zA-Z0-9]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it'] },
						avatar: { type: 'string' },
					},
				},
			},
			required: ['isAuthenticated', 'user'],
		},
		401: {
			description: 'Utilisateur non authentifié',
			type: 'object',
			properties: {
				isAuthenticated: { type: 'boolean', const: false },
				user: { type: 'null', const: null },
			},
			required: ['isAuthenticated', 'user'],
		},
	},
}

export const authGoogleCallback = {
	description: 'Callback pour l\'authentification Google. Utilisé après la redirection de Google.',
	tags: ['Authentification'],
	body: {
		type: 'object',
		properties: {
			jwt: { type: 'string', minLength: 1 },
		},
		required: ['jwt'],
	},
	response: {
		200: {
			description: 'Authentification Google réussie',
			type: 'object',
			properties: {
				isAuthenticated: { type: 'boolean', const: true },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number', minLength: 3, maxLength: 5 },
						email: { type: 'string', format: 'email' },
						username: { type: 'string', minLength: 3, maxLength: 15, pattern: '^[a-zA-Z0-9]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it'] },
						avatar: { type: 'string' },
					},
				},
			},
			required: ['isAuthenticated', 'user'],
			additionalProperties: true,

		},
		401: {
			description: 'Authentification Google échouée',
			type: 'object',
			properties: {
				isAuthenticated: { type: 'boolean', const: false },
				user: { type: 'null', const: null },
			},
			required: ['isAuthenticated', 'user'],
			additionalProperties: true,
		},
	},
};

export const UploadAvatar = {
	description: 'Upload d\'avatar utilisateur',
	tags: ['Authentification'],
	consumes: ['multipart/form-data'],
	body: {
		properties: {
			avatar: {
				type: 'string',
				format: 'binary'
			}
		},
		required: ['avatar']
	},
	response: {
		200: {
			description: 'Avatar uploadé avec succès',
			type: 'object',
			properties: {
				success: { type: 'boolean', const: true },
				message: { type: 'string' },
				url: { type: 'string', format: 'uri' },
				fileName: { type: 'string' },
			}
		},
		400: {
			description: 'Fichier invalide',
			...messageResponse,
		},
		401: {
			description: 'Non authentifié',
			...messageResponse,
		},
	},
};

export const verifyCode = {
	description: 'Vérification d\'un code',
	tags: ['Authentification'],
	body: {
		type: 'object',
		properties: {
			code: { type: 'string', minLength: 25 },
		},
		required: ['code'],
		additionalProperties: false,
		errorMessage: {
			required: {
				code: 'errors.code.required',
			},
			properties: {
				code: 'errors.code.invalid',
			},
			additionalProperties: 'errors.NoadditionalProperties',
		}
	},
	response: {
		200: {
			description: 'Code vérifié avec succès',
			...messageResponse,
		},
		400: {
			description: 'Code invalide',
			...messageResponse,
		},
		401: {
			description: 'Non autorisé',
			...messageResponse,
		},
	},
};

export default {
	login,
	register,
	update,
	logout,
	isAuth,
	authGoogleCallback,
	UploadAvatar,
	verifyCode,
};