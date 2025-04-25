import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { createGame } from './game/initGame.js';
import path from 'path';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
// Setup chemin
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Création du jeu
const game = createGame();
const fastify = Fastify();
// Serveur statique pour le frontend
await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend'), // <- corrigé ici
    prefix: '/', // tout est servi depuis /
});
// WebSocket
await fastify.register(websocket);
// Connexions des joueurs WebSocket
const players = new Set();
// Route WebSocket uniquement (pas de conflit avec '/')
fastify.get('/ws', { websocket: true }, (socket, req) => {
    console.log('✅ Client connecté via WebSocket');
    socket.id = 1234;
    console.log(socket.id);
    players.add(socket);
    console.log(players);
    //   game.start(game.getBall(), socket)
    socket.on('close', () => {
        console.log(`❌ Client déconnecté`);
    });
});
// ✅ Plus besoin de déclarer '/' manuellement, fastify-static s'en occupe
// Lancement du serveur
fastify.listen({ port: 4000 }, (err) => {
    if (err) {
        console.error('❌ Erreur de démarrage :', err);
        process.exit(1);
    }
    console.log('🚀 Serveur en écoute sur http://localhost:4000');
});
