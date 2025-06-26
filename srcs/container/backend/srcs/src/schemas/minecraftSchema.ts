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

export const setMinecraftUser = {
	description: 'Mise à jour des informations Minecraft de l\'utilisateur',
	tags: ['minecraft'],
	body: {
		type: 'object',
		properties: {
			_eaglercraftX_g: { type: 'string', minLength: 1 },
			_eaglercraftX_p: { type: 'string', minLength: 1 },
			_eaglercraftX_r: { type: 'string', minLength: 1 },
			lastMinecraftAccess: { type: 'number' },
			resourcePacks: {
				type: 'array',
				nullable: true
			},
			worlds: {
				type: 'array',
				nullable: true
			}
		},
		required: ['_eaglercraftX_g', '_eaglercraftX_p', '_eaglercraftX_r', 'lastMinecraftAccess'],
		additionalProperties: false,
		errorMessage: {
			required: {
				_eaglercraftX_g: 'errors.minecraft._eaglercraftX_g.required',
				_eaglercraftX_p: 'errors.minecraft._eaglercraftX_p.required',
				_eaglercraftX_r: 'errors.minecraft._eaglercraftX_r.required',
				lastMinecraftAccess: 'errors.minecraft.lastMinecraftAccess.required',
			},
			properties: {
				_eaglercraftX_g: 'errors.minecraft._eaglercraftX_g.invalid',
				_eaglercraftX_p: 'errors.minecraft._eaglercraftX_p.invalid',
				_eaglercraftX_r: 'errors.minecraft._eaglercraftX_r.invalid',
				lastMinecraftAccess: 'errors.minecraft.lastMinecraftAccess.invalid',
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