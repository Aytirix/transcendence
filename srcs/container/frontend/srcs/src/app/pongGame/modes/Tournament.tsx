import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

const Tournament: React.FC = () => {
	const socketRef = useRef<WebSocket | null>(null);
	const navigate = useNavigate();
	const quit = () => {
		socketRef.current?.send(JSON.stringify({type: "Tournament", action: "Quit"}))
		navigate('/pong/menu');
	}
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;

		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
		};
		return () => {
			socket.close();
		};
	}, []);

	useEffect(() => {
		if (!socketRef.current) return;

		const interval = setInterval(() => {
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				socketRef.current.send(JSON.stringify({ type: 'Ping' }));
			}
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	return(
		<div className='page-custom'>
			<div>
				<h1 className='Title'>Tournament</h1>
				<button onClick={quit} className='button-accueil'>Quit</button>
			</div>
			<div className='popup'>
				<table>
					<thead>
						<tr>
							<th className='th-menu'>
								liste des joueurs
							</th>
						</tr>
					</thead>
				</table>
			</div>
		</div>
	);
};

export default Tournament;