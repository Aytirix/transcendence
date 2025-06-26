export const getMinecraftUser = {
	description: 'Récupération des informations Minecraft de l\'utilisateur',
	tags: ['minecraft'],
	response: {
		200: {
			description: 'Informations Minecraft récupérées avec succès',
			type: 'object',
			properties: {
				compressed: { type: 'string', nullable: true },
			},
		},
	},
};

export const setMinecraftUser = {
	description: 'Mise à jour des informations Minecraft de l\'utilisateur',
	tags: ['minecraft'],
	body: {
		type: 'object',
		properties: {
			compressed: { type: 'string', minLength: 1 },
		},
		required: ['compressed'],
		additionalProperties: false,
		errorMessage: {
			required: {
				compressed: 'errors.minecraft.compressed.required',
			},
			properties: {
				compressed: 'errors.minecraft.compressed.invalid',
			},
			additionalProperties: 'errors.NoadditionalProperties',
		}
	},
	response: {
		200: {
			description: 'Informations Minecraft mises à jour avec succès',
		},
		400: {
			description: 'Format des données incorrect',
		},
	}
};

export default {
	getMinecraftUser,
	setMinecraftUser,
};