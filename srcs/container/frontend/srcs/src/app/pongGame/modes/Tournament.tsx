import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { MatchDisplayData, Tournament } from '../types/data';
import ApiService from '../../../api/ApiService';

const TournamentPage: React.FC = () => {
	const [listTournament, setListTournament] = useState<Tournament[]>([])
	const [listName, setListName] = useState<string []>([]);
	const [sizeTournament, setSizeTournament] = useState<number | null>(null);
	const [startTournament, setStartTournament] = useState(false);
	const playerName = useRef<string | null>(null);
	const [nbRounds, setNbRounds] = useState<number | null>(null)
	const [rounds, setRounds] = useState<number | null>(null)
	const [player1, setPlayer1] = useState<string | null>(null);
	const [player2, setPlayer2] = useState<string | null>(null);
	const [player1Avatar, setPlayer1Avatar] = useState<string | undefined>(undefined)
	const [player2Avatar, setPlayer2Avatar] = useState<string | undefined>(undefined)

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
			socket.send(JSON.stringify({type: "Tournament", action: "infoTournament"}))
		}
		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.action === "LIST_RESPONSE")
				setListTournament(data.value);
			else if (data.action === "infoTournament") {
				setIdTournament(data.id);
				console.log("name action", data.name)
				playerName.current =data.name;
				socketRef.current?.send(JSON.stringify({ type: "Tournament", action: "Display" }));
			}
			else if (data.action === "Display") {
				setStartTournament(true);
				setRounds(data.currentManche);
				displayDuel(data.value) 
				setTimeout(() => {
					navigate('/pong/menu/GameTournament')
				}, 2000)
			}
		};
		return () => {
			socket.close();
		};
	}, []);

	useEffect(() => {
	console.log("player1:", player1);
	console.log("player2:", player2);
	}, [player1, player2]);


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

	function displayDuel(tab: MatchDisplayData[]) {
		for (const tournament of tab) {
			if (tournament.player1 == playerName.current 
				|| tournament.player2 == playerName.current) {
				setPlayer1(tournament.player1)
				setPlayer2(tournament.player2)
				setNbRounds(tournament.totalRound)
				setPlayer1Avatar(ApiService.getFile(tournament.player1Avatar))
				setPlayer2Avatar(ApiService.getFile(tournament.player2Avatar))
				break ;
			}
		}
	}

	return(
		<div className='page-custom'>
			<div>
				{!startTournament ?
					<h1 className='Title'>Tournament</h1>
					: <>
						<h1 className='Title'>Rounds {rounds} / {nbRounds}</h1>
						<h1 className='VS'>VS</h1>
					</>
				}
				<button onClick={quit} className='button-accueil'>Quit</button>
			</div>
			{!startTournament ?
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
				:	<>
						<div className='popup-player1'>
							<img src={player1Avatar} alt='Avatar'/>
							<h1 className='Player1'>{player1}</h1>
						</div>
						<div className='popup-player2'>
							<img src={player2Avatar} alt='Avatar'/>
							<h1 className='Player2'>{player2}</h1>
						</div>
					</>
			}
		</div>
	);
};

export default TournamentPage;