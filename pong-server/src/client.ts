// client.ts
import { isJSONType } from 'ajv/dist/compile/rules';
import WebSocket from 'ws';

const socket = new WebSocket('ws://localhost:4000');

socket.on('open', () => {
	console.log('✅ Connexion établie');
	socket.send('Hello serveur !');
});

socket.on('message', (data) => {
	const isjson  = (str: string): boolean => {
		try {
			JSON.parse(str);
			return (true);
		}
		catch {
			return false
		}
	};
	if (isjson(data.toString())) {
		const parse: string = JSON.parse(data.toString());
		console.log(parse);
	}
	else
		console.log('📨 Réponse serveur :', data.toString());
});
