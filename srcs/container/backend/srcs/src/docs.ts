import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

export async function setupSwagger(app: FastifyInstance) {
	// Enregistrement de Swagger avec gestion des erreurs
	try {
		await app.register(fastifySwagger, {
			openapi: {
				info: {
					title: 'Transcendence API',
					version: '1.0.0',
					description: 'Documentation API pour l\'application Transcendence',
				},
				// Les serveurs seront configurés dynamiquement dans transformSpecification
				servers: [],
			},
		});

		// Enregistrement de Swagger UI
		await app.register(fastifySwaggerUi, {
			routePrefix: '/docs',
			uiConfig: {
				docExpansion: 'list',
				deepLinking: true,
				defaultModelsExpandDepth: -1,
			},
			staticCSP: false,
			// Configuration pour corriger les chemins des ressources statiques
			theme: {
				title: 'Transcendence API Documentation'
			},
			transformStaticCSP: (header: string) => header,
			transformSpecification: (swaggerObject: any, request: any) => {
				// Créer une copie modifiable de l'objet
				const modifiedSpec = JSON.parse(JSON.stringify(swaggerObject));
				
				// Construire l'URL de base dynamiquement
				const protocol = request.headers['x-forwarded-proto'] || 'https';
				const host = request.headers['x-forwarded-host'] || request.headers.host;
				const baseUrl = `${protocol}://${host}/api`;
				
				modifiedSpec.servers = [
					{
						url: baseUrl,
						description: 'API Server',
					},
				];
				return modifiedSpec;
			},
		});
	} catch (err) {
		console.error('Erreur lors de la configuration de Swagger:', err);
		throw new Error('Swagger setup failed');
	}
}
