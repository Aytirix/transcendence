import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Tournament } from '../types/data';

const TournamentPage: React.FC = () => {
	const [listTournament, setListTournament] = useState<Tournament[]>([])
	const [listName, setListName] = useState<string []>([]);
	const [sizeTournament, setSizeTournament] = useState<number | null>(null);

	const [idTournament, setIdTournament] = useState<number>(0);
	const socketRef = useRef<WebSocket | null>(null);

	const navigate = useNavigate();

	const quit = () => {
		socketRef.current?.send(JSON.stringify({type: "Tournament", action: "Quit"}))
		navigate('/pong/menu');
	}
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;
		socket.onopen = () => {
			socket.send(JSON.stringify({type: "Tournament", action: "idTournament"}))
		}
		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.action === "LIST_RESPONSE")
				setListTournament(data.value);
			else if (data.action === "idTournament") {
				setIdTournament(data.value);
				socketRef.current?.send(JSON.stringify({ type: "Tournament", action: "Display" }));
			}
			else if (data.action === "Start") {
				console.log("lancement du tournois")
			}
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

	useEffect(() => {
		if (idTournament === null) return;
		for (const tournament of listTournament) {
			if (tournament.id === idTournament) {
				setListName(tournament.listPlayers);
				setSizeTournament(tournament.max)
			}
		}
	}, [listTournament, idTournament])

	return(
		<div className='page-custom'>
			<div>
				<h1 className='Title'>Tournament</h1>
				<button onClick={quit} className='button-accueil'>Quit</button>
			</div>
				<div className="popup">
					<table className="table-menu">
						<thead>
							<tr>
								<th className="th-menu">Players Name</th>
								<th className="th-menu">Place</th>
							</tr>
						</thead>
						<tbody>
							{listName.map((name, i) => (
								<tr key={i}>
									<td className="td-tournament-size">{name}</td>
									<td className="td-tournament-size">{i + 1}/{sizeTournament}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
		</div>
	);
};

export default TournamentPage;