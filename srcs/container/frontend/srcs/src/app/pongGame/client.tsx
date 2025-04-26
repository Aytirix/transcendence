import React, { useEffect, useRef, useState } from 'react';

interface Parse {
	ball: {
		pos_x: number;
		pos_y: number;
		d_x: number;
		d_y: number;
		readonly speed: number;
		readonly radius: number;
	};
	player1: {
		pos_x: number;
		pos_y: number;
		userName: string;
		readonly height: number;
		readonly width: number;
		readonly margin: number;
		readonly speed: number;
		score: number;
	};
	player2: {
		pos_x: number;
		pos_y: number;
		userName: string;
		readonly height: number;
		readonly width: number;
		readonly margin: number;
		readonly speed: number;
		score: number;
	};
}

export const Pong: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const [parsedData, setParsedData] = useState<Parse | null>(null);

	const keyPressed = useRef({
		up_p1: false,
		down_p1: false,
		up_p2: false,
		down_p2: false,
	});

	useEffect(() => {
		const socket = new WebSocket('wss://localhost:7000/pong');
		socketRef.current = socket;

		socket.addEventListener('open', () => {
			console.log('✅ Connexion établie');
			socket.send('Hello serveur !');
		});

		socket.addEventListener('message', (event: MessageEvent) => {
			const str = event.data;

			try {
				const json = JSON.parse(str);
				setParsedData(json);
			} catch {
				console.log('📨 Réponse serveur :', str);
			}
		});

		return () => {
			socket.close();
		};
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');

		if (!canvas || !ctx || !parsedData) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.closePath();
		ctx.fillStyle = 'black';
		ctx.fillRect(
			parsedData.player1.pos_x,
			parsedData.player1.pos_y,
			parsedData.player1.width,
			parsedData.player1.height
		);
		ctx.fillRect(
			parsedData.player2.pos_x,
			parsedData.player2.pos_y,
			parsedData.player2.width,
			parsedData.player2.height
		);
		ctx.beginPath();
		ctx.fillStyle = 'red';
		ctx.arc(parsedData.ball.pos_x, parsedData.ball.pos_y, 10, 0, Math.PI * 2);
		ctx.fill();
	}, [parsedData]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowUp') keyPressed.current.up_p1 = true;
			if (e.key === 'ArrowDown') keyPressed.current.down_p1 = true;
			if (e.key === 'w') keyPressed.current.up_p2 = true;
			if (e.key === 's') keyPressed.current.down_p2 = true;
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'ArrowUp') keyPressed.current.up_p1 = false;
			if (e.key === 'ArrowDown') keyPressed.current.down_p1 = false;
			if (e.key === 'w') keyPressed.current.up_p2 = false;
			if (e.key === 's') keyPressed.current.down_p2 = false;
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		const interval = setInterval(() => {
			const socket = socketRef.current;
			if (!socket || socket.readyState !== WebSocket.OPEN) return;

			if (keyPressed.current.up_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_up' }));
			else if (keyPressed.current.down_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_down' }));

			if (keyPressed.current.up_p2) socket.send(JSON.stringify({ type: 'Move', value: 'p2_up' }));
			else if (keyPressed.current.down_p2) socket.send(JSON.stringify({ type: 'Move', value: 'p2_down' }));
		}, 1000 / 60);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			clearInterval(interval);
		};
	}, []);

	// 🔥 Fonction SameKeyboard pour ton bouton
	function SameKeyboard() {
		const socket = socketRef.current;
		if (!socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({ type: "SameKeyboard" }));
	}

	return (
		<div>
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				style={{ border: '2px solid black', display: 'block', margin: '0 auto' }}
			/>
			<button onClick={SameKeyboard}>Same Keyboard</button>
			<button>Solo</button>
			<button>Multi</button>
		</div>
	);
};

export default Pong;
