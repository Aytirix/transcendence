import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { MatchDisplayData, StatModeTournament, Tournament } from '../types/data';
import ApiService from '../../../api/ApiService';
import { useLanguage } from '../../../contexts/LanguageContext';

const TournamentPage: React.FC = () => {
	const [listTournament, setListTournament] = useState<Tournament[]>([])
	const [listNameAvatar, setListNameAvatar] = useState<{ name: string, avatar: string, statistique: StatModeTournament}[]>([]);
	const [sizeTournament, setSizeTournament] = useState<number | null>(null);
	const [startTournament, setStartTournament] = useState(false);
	const playerName = useRef<string | null>(null);
	const [nbRounds, setNbRounds] = useState<number | null>(null)
	const [rounds, setRounds] = useState<number | null>(null)
	const [player1, setPlayer1] = useState<string | null>(null);
	const [player2, setPlayer2] = useState<string | null>(null);
	const [player1Avatar, setPlayer1Avatar] = useState<string | undefined>(undefined)
	const [player2Avatar, setPlayer2Avatar] = useState<string | undefined>(undefined)
	const [isWinnerTournament, setIsWinnerTournament] = useState(false);
	const [nameWinner, setNameWinner] = useState<string | null>(null)
	const [autoQualified, setAutoQualified] = useState(false);
	const switchDisplay = useRef(false);
	const { t } = useLanguage();

	const [idTournament, setIdTournament] = useState<number>(0);
	const socketRef = useRef<WebSocket | null>(null);

	const navigate = useNavigate();

	const quit = () => {
		socketRef.current?.send(JSON.stringify({ type: "Tournament", action: "Quit" }))
		navigate('/pong');
	}
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;
		socket.onopen = () => {
			socket.send(JSON.stringify({ type: "Tournament", action: "infoTournament" }))
			socket.send(JSON.stringify({ type: "Tournament", action: "readyToNext" }))
		}
		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.action === "LIST_RESPONSE")
				setListTournament(data.value);
			else if (data.action === "infoTournament") {
				setIdTournament(data.id);
				console.log("name action", data.name)
				playerName.current = data.name;
				socketRef.current?.send(JSON.stringify({ type: "Tournament", action: "Display" }));
			}
			else if (data.action === "WinNextManche") {
				setAutoQualified(true);
				switchDisplay.current = true;
				setTimeout(() => {
					setAutoQualified(false);
				}, 3000);
				console.log("win next manche")
			}
			else if (data.action === "Display") {
				if (!switchDisplay.current) {
					setStartTournament(true);
					setRounds(data.currentManche);
					displayDuel(data.value)
					setTimeout(() => {
						navigate('/pong/menu/GameTournament')
					}, 3000)
				}
				switchDisplay.current = false;
			}
			else if (data.action === "WinnerTournament") {
				console.log(data.message);
				setIsWinnerTournament(true);
				setNameWinner(data.value);
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
				setListNameAvatar(tournament.listPlayers);
				console.log("ListNameAvatar : ", listNameAvatar);
				console.log("tournament ListNameAvatar : ", tournament.listPlayers);
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
				break;
			}
		}
	}

	return (
		<div className='page-custom'>
			{!isWinnerTournament
				?
				(<>
					<div>
						{!startTournament ?
							<h1 className='Title'>{t("pong.tournament.title")}</h1>
							: <>
								<h1 className='Title'>{t("pong.tournament.manches")} {rounds} / {nbRounds}</h1>
								<h1 className='VS'>VS</h1>
							</>
						}
						<button onClick={quit} className='button-accueil'>{t("pong.tournament.quitter")}</button>
					</div>
					{!startTournament ?
						<div className="popup-tournament">
							{listNameAvatar.map((name, i) => (
								<div key={i}>
									<div className="td-tournament-size td-joueur mr-3">
										<div className='popup-img-tournament'>
											<img src={ApiService.getFile(name.avatar)} alt="" />
										</div>
										<div className='text-4xl	'>
											{name.name}
										</div>
										<div className="flex flex-col items-start text-xl">
											<div>{t("pong.gamemenu.victoires")} : {name.statistique.total.victoire}</div>
											<div>{t("pong.gamemenu.defaites")} : {name.statistique.total.defaite}</div>
											<div>{t("pong.gamemenu.tournoisgagnes")} : {name.statistique.tournamentVictory}</div>
											<div>{t("pong.gamemenu.abandons")} : {name.statistique.total.abandon}</div>
										</div>
										<div className='mr-10 text-2xl'>
											{i + 1}/{sizeTournament}
										</div>
									</div>
								</div>
							))}
						</div>
						: <>
							{autoQualified && (
								<h2 className='Info'>{t("pong.tournament.nextQualifierRounds")}</h2>
							)}
							<div className='popup-player1'>
								<img src={player1Avatar} alt='Avatar' />
								<h1 className='Player1'>{player1}</h1>
							</div>
							<div className='popup-player2'>
								<img src={player2Avatar} alt='Avatar' />
								<h1 className='Player2'>{player2}</h1>
							</div>
						</>
					}
				</>)
				: <>
					<div className='WinnerPage'>
						<div className='popup-WinnerPage'>
							<div className='avatar-Winner'></div>
							<img src="/images/logomarvel.png" alt="logo" className='img-logo'/>
						</div>
							<img src="/images/certificat.png" alt="certificat" className='img-certificat'/>
					</div>
		</>
			}
		</div>
	);
};

export default TournamentPage;