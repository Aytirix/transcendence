import { messageResponse } from './common';

export const login = {
	description: "Connexion utilisateur. Tant qu'il a un cookie sessionId coté client, il peut être considéré comme connecté.",
	tags: ['Authentification'],
	body: {
		type: 'object',
		properties: {
			email: { type: 'string', minLength: 3, maxLength: 50 },
			password: { type: 'string', minLength: 3 },
			// password: { 
			// 	type: 'string', 
			// 	minLength: 8, 
			// 	maxLength: 25, 
			// 	pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%$#^:;\'"|*?&.,<>\\\\/\\-_=+()])[A-Za-z\\d@$!%$#^:;\'"|*?&.,<>\\\\/\\-_=+()]{8,25}$' 
			// },
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
			type: 'object',
			properties: {
				message: { type: 'string' },
				redirect: { type: 'string', nullable: true, description: 'Redirection vers une page spécifique' },
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
			username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' },
			confirmPassword: { type: 'string', minLength: 3 },
			// confirmPassword: { 
			// 	type: 'string', 
			// 	minLength: 8, 
			// 	maxLength: 25, 
			// 	pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%$#^:;\'"|*?&.,<>\\\\/\\-_=+()])[A-Za-z\\d@$!%$#^:;\'"|*?&.,<>\\\\/\\-_=+()]{8,25}$' 
			// },
			lang: { type: 'string', enum: ['fr', 'en', 'it', 'es'] },
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
			username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9\u00C0-\u017F]+$' },
			twofa: { type: 'boolean' },
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
						username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9\u00C0-\u017F]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it', 'es'] },
						avatar: { type: 'string' },
						twofa: { type: 'boolean' },
					},
					required: ['id', 'email', 'username', 'lang', 'avatar', 'twofa'],
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
			properties: {
				redirect: { type: 'string', nullable: true, description: 'Redirection vers une page spécifique' },
			},
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
				redirect: { type: 'string', nullable: true, description: 'Redirection vers une page spécifique' },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number', minLength: 3, maxLength: 5 },
						email: { type: 'string', format: 'email' },
						username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it', 'es'] },
						avatar: { type: 'string' },
					},
				},
			},
			required: ['isAuthenticated', 'redirect', 'user'],
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
						username: { type: 'string', minLength: 3, maxLength: 10, pattern: '^[a-zA-Z0-9]+$' },
						lang: { type: 'string', enum: ['fr', 'en', 'it', 'es'] },
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
	tags: ['user'],
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
			password: { type: 'string', minLength: 8, maxLength: 25, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.])[A-Za-z\\d@$!%*?&.]{8,25}$' },
			confirmPassword: { type: 'string', minLength: 8, maxLength: 25, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.])[A-Za-z\\d@$!%*?&.]{8,25}$' },
		},
		required: ['code'],
		additionalProperties: false,
		errorMessage: {
			required: {
				code: 'errors.code.required',
				password: 'errors.password.required',
				confirmPassword: 'errors.password.required',
			},
			properties: {
				code: 'errors.code.invalid',
				password: 'errors.password.invalid',
				confirmPassword: '',
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

export const forgetPassword = {
	description: 'Réinitialisation du mot de passe',
	tags: ['Authentification'],
	body: {
		type: 'object',
		properties: {
			email: { type: 'string', format: 'email', minLength: 3, maxLength: 50 },
		},
		required: ['email'],
		additionalProperties: false,
		errorMessage: {
			required: {
				email: 'errors.email.required',
			},
			properties: {
				email: 'errors.email.invalid',
			},
			additionalProperties: 'errors.NoadditionalProperties',
		}
	},
	response: {
		200: {
			description: 'Email de réinitialisation envoyé',
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
			required: ['message'],
		},
		400: {
			description: 'Format des données incorrect',
			type: 'object',
			properties: {
				message: { type: 'string' },
			},
			required: ['message'],
		},
	},
};

export const getMinecraftUser = {
	description: 'Récupération des informations Minecraft de l\'utilisateur',
	tags: ['minecraft'],
	response: {
		200: {
			description: 'Informations Minecraft récupérées avec succès',
			type: 'object',
			properties: {
				_eaglercraftX_g: { type: 'string', nullable: true },
				_eaglercraftX_p: { type: 'string', nullable: true },
				_eaglercraftX_r: { type: 'string', nullable: true },
				lastMinecraftAccess: { type: 'number', nullable: true },
				resourcePacks: {
					nullable: true
				},
				worlds: {
					nullable: true
				}
			},
		},
	},
};

export const getUserProfile = {
	description: 'Récupération du profil utilisateur par ID',
	tags: ['Utilisateur'],
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
			description: 'Profil utilisateur récupéré avec succès',
			type: 'object',
			properties: {
				success: { type: 'boolean', const: true },
				user: {
					type: 'object',
					properties: {
						id: { type: 'number' },
						username: { type: 'string' },
						avatar: { type: 'string', nullable: true },
						lang: { type: 'string' },
					},
					required: ['id', 'username', 'avatar', 'lang'],
				},
			},
			required: ['success', 'user'],
		},
		400: {
			description: 'ID utilisateur invalide',
			type: 'object',
			properties: {
				success: { type: 'boolean', const: false },
				message: { type: 'string' },
			},
			required: ['success', 'message'],
		},
		404: {
			description: 'Utilisateur non trouvé',
			type: 'object',
			properties: {
				success: { type: 'boolean', const: false },
				message: { type: 'string' },
			},
			required: ['success', 'message'],
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
	forgetPassword,
	getUserProfile,
};