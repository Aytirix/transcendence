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
	const [mode, setMode] = useState<"SameKeyboard" | "Solo" | "Multi" | "EXIT" | null>(null);
	const [whoAmI, setWhoAmI] = useState<"player1" | "player2" | null>(null);
	const [resetView, setResetView] = useState(false);
	const [showTournamentOptions, setShowTournamentOptions] = useState(false);
	const [tournamentName, setTournamentName] = useState('');
	const [tournamentSize, setTournamentSize] = useState(4);
	const [tournamentList, setTournamentList] = useState<{ name: any; id: string; current: number; max: number; }[]>([]);

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
			const savedMode = localStorage.getItem('pongMode') as "SameKeyboard" | "Solo" | "Multi" | "EXIT" | null;
			if (savedMode && savedMode !== "EXIT") {
				socket.send(JSON.stringify({ type: savedMode }));
				setMode(savedMode);
			}
		});

		socket.addEventListener('message', (event: MessageEvent) => {
			const str = event.data;
			try {
				const json = JSON.parse(str);
				if (json.type === "assign") return setWhoAmI(json.value);
				if (json.type === "EXIT") return setMode("EXIT");
				if (json.type === "reset") return setResetView(true);
				if (json.type === "SameKeyboard" || json.type === "Multi" || json.type === "Solo") {
					setMode(json.type);
					return;
				}
				if (json.type === "Tournament" && json.action === "LIST_RESPONSE") {
					setTournamentList(json.value);
					return;
				}
				if (json.ball && json.player1 && json.player2) {
					setResetView(false);
					setParsedData(json);
				}
			} catch {
				console.log('Message serveur :', str);
			}
		});

		window.addEventListener('beforeunload', () => localStorage.removeItem('pongMode'));
		socket.addEventListener('close', () => localStorage.removeItem('pongMode'));

		return () => {
			window.removeEventListener('beforeunload', () => {});
			socket.close();
		};
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.closePath();
		if (parsedData && parsedData.player1 && parsedData.player2 && parsedData.ball && !resetView) {
			ctx.fillStyle = 'black';
			ctx.fillRect(parsedData.player1.pos_x, parsedData.player1.pos_y, parsedData.player1.width, parsedData.player1.height);
			ctx.fillRect(parsedData.player2.pos_x, parsedData.player2.pos_y, parsedData.player2.width, parsedData.player2.height);
			ctx.beginPath();
			ctx.fillStyle = 'red';
			ctx.arc(parsedData.ball.pos_x, parsedData.ball.pos_y, 10, 0, Math.PI * 2);
			ctx.fill();
		}
	}, [parsedData, resetView]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (mode === "EXIT") return;
			if (e.key === 'ArrowUp') keyPressed.current.up_p1 = true;
			if (e.key === 'ArrowDown') keyPressed.current.down_p1 = true;
			if (mode === "SameKeyboard") {
				if (e.key === 'w') keyPressed.current.up_p2 = true;
				if (e.key === 's') keyPressed.current.down_p2 = true;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (mode === "EXIT") return;
			if (e.key === 'ArrowUp') keyPressed.current.up_p1 = false;
			if (e.key === 'ArrowDown') keyPressed.current.down_p1 = false;
			if (mode === "SameKeyboard") {
				if (e.key === 'w') keyPressed.current.up_p2 = false;
				if (e.key === 's') keyPressed.current.down_p2 = false;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		const interval = setInterval(() => {
			const socket = socketRef.current;
			if (!socket || socket.readyState !== WebSocket.OPEN || !mode || mode === "EXIT") return;
			if (mode === "SameKeyboard") {
				if (keyPressed.current.up_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_up' }));
				else if (keyPressed.current.down_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_down' }));
				if (keyPressed.current.up_p2) socket.send(JSON.stringify({ type: 'Move', value: 'p2_up' }));
				else if (keyPressed.current.down_p2) socket.send(JSON.stringify({ type: 'Move', value: 'p2_down' }));
			} else if (mode === "Multi" && whoAmI) {
				const val = whoAmI === "player1" ? 'p1' : 'p2';
				if (keyPressed.current.up_p1) socket.send(JSON.stringify({ type: 'Move', value: `${val}_up` }));
				else if (keyPressed.current.down_p1) socket.send(JSON.stringify({ type: 'Move', value: `${val}_down` }));
			} else if (mode === "Solo") {
				if (keyPressed.current.up_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_up' }));
				else if (keyPressed.current.down_p1) socket.send(JSON.stringify({ type: 'Move', value: 'p1_down' }));
			}
		}, 1000 / 60);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			clearInterval(interval);
		};
	}, [mode, whoAmI]);

	useEffect(() => {
		const interval = setInterval(() => {
			const socket = socketRef.current;
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: 'Ping' }));
			}
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	function sendMode(selectedMode: "SameKeyboard" | "Solo" | "Multi" | "EXIT") {
		const socket = socketRef.current;
		if (!socket || socket.readyState !== WebSocket.OPEN) return;
		localStorage.setItem('pongMode', selectedMode);
		setMode(selectedMode);
		socket.send(JSON.stringify({ type: selectedMode }));
	}

	return (
		<div>
			<canvas ref={canvasRef} width={800} height={600} style={{ border: '2px solid black', display: 'block', margin: '0 auto' }} />
			{mode === "EXIT" && <div style={{ textAlign: 'center', fontSize: '24px', marginTop: '20px', color: 'red' }}>🎉 Partie terminée !</div>}

			<div style={{ textAlign: 'center', marginTop: '10px' }}>
				<button onClick={() => sendMode("SameKeyboard")}>Same Keyboard</button>
				<button onClick={() => sendMode("Solo")}>Solo</button>
				<button onClick={() => sendMode("Multi")}>Multi</button>
				<button onClick={() => sendMode("EXIT")}>EXIT</button>
				<button onClick={() => setShowTournamentOptions(!showTournamentOptions)}>Tournament</button>
				{showTournamentOptions && (
					<div style={{ marginTop: '10px' }}>
						<h4>Tournois en attente :</h4>
						{tournamentList.length === 0 ? (
							<p>Aucun tournoi disponible</p>
						) : (
							<ul style={{ listStyle: 'none', padding: 0 }}>
								{tournamentList.map((t) => (
									<li key={t.id} style={{ marginBottom: '10px' }}>
										{typeof t.name === 'string' ? t.name : JSON.stringify(t.name)} — {t.current}/{t.max} joueurs
										<button
											style={{ marginLeft: '10px' }}
											onClick={() => {
												const socket = socketRef.current;
												if (!socket || socket.readyState !== WebSocket.OPEN) return;
												socket.send(JSON.stringify({
													type: "Tournament",
													action: "JOIN",
													id: t.id
												}));
											}}
										>
											Rejoindre
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}

				{showTournamentOptions && (
					<div style={{ marginTop: '10px' }}>
						<input
							type="text"
							placeholder="Nom du tournoi"
							value={tournamentName}
							onChange={(e) => setTournamentName(e.target.value)}
						/>
						<select value={tournamentSize} onChange={(e) => setTournamentSize(parseInt(e.target.value))} style={{ marginLeft: '10px' }}>
							<option value={4}>4 joueurs</option>
							<option value={8}>8 joueurs</option>
							<option value={16}>16 joueurs</option>
							<option value={32}>32 joueurs</option>
						</select>
						<button
							style={{ marginLeft: '10px' }}
							onClick={() => {
								const socket = socketRef.current;
								if (!socket || socket.readyState !== WebSocket.OPEN) return;
								if (!tournamentName.trim()) return alert("Veuillez entrer un nom de tournoi");
								socket.send(JSON.stringify({
									type: "Tournament",
									action: "Create",
									value: tournamentName,
									sizeTournament: tournamentSize
								}));
								setShowTournamentOptions(false);
							}}
						>
							Créer
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Pong;
