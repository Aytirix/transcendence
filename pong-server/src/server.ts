import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import { FastifyRequest } from 'fastify'
import { WebSocket, RawData } from 'ws'
import { createGame } from './game/initGame.js'
import { Game } from './game/Game.js'


const game: Game = createGame()
const fastify = Fastify()

await fastify.register(websocket)

const player: Set<WebSocket> = new Set; //ici

fastify.get('/', { websocket: true }, (socket: any, req: FastifyRequest) => {
	console.log('✅ Client connecté')
	player.add(socket);
	 
	
	// socket.send('Bienvenue sur le serveur TypeScript !')
	game.start(game.getBall(), socket);

  socket.on('message', (message: RawData) => {
    const msg = message.toString()
    console.log('📨 Message reçu :', msg)
    socket.send(`Réponse du serveur : "${msg}"`)
  })

  socket.on('close', () => {
    console.log('❌ Client déconnecté')
  })
})

fastify.listen({ port: 4000 }, (err) => {
  if (err) {
    console.error('❌ Erreur de démarrage :', err)
    process.exit(1)
  }
  console.log('🚀 Serveur en écoute sur ws://localhost:4000')
})
