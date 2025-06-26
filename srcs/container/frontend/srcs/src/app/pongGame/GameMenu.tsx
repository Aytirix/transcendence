import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Tournament } from "./types/data";

const GameMenu: React.FC = () => {
	const navigate = useNavigate();
	const socketRef = useRef<WebSocket | null>(null);
	const [listTournament, setListTournament] = useState<Tournament[]>([]);
	const [validationButton, setValidationButton] = useState(false);
	const [nameTournament, setNameTournament] = useState("");
	const [size, setSize] = useState("4");
	const [idJoin, setIdJoin] = useState("");
	const [showTournament, setShowTournament] = useState(false);
	const [showCreate, setShowCreate] = useState(false);
	const [showJoin, setShowJoin] = useState(false);

	const SameKeyboard = () => navigate('/pong/menu/SameKeyboard');
	const Solo = () => navigate('/pong/menu/Solo');
	const MultiPlayers = () => navigate('/pong/menu/MultiPlayers');

	const Validation = () => {
		showCreate 
		? 	socketRef.current?.send(JSON.stringify({
			type: "Tournament",
			action: "Create",
			value: nameTournament,
			sizeTournament: size
		}))
		: socketRef.current?.send(JSON.stringify({
			type: "Tournament",
			action: "Join",
			id: parseInt(idJoin, 10)
		}))
		setValidationButton(false);
		setShowCreate(false);
		navigate('/pong/menu/Tournament');
	};

	const Tournament = () => {
		if (showTournament) {
			setShowTournament(false);
			setShowCreate(false);
			setValidationButton(false);
			setShowJoin(false);
		} else {
			setShowTournament(true);
			socketRef.current?.send(JSON.stringify({ type: "Tournament", action: "Display" }));
			console.log("test")
		}
	};
	const Create = () => {
		if (showCreate) {
			setShowCreate(false);
			setValidationButton(false);
		} else {
			setShowCreate(true);
			setShowJoin(false);
		}
	};
	const Join = () => {
		setShowCreate(false);
		if (showJoin)
			setShowJoin(false);
		else
			setShowJoin(true);
	}
	
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;

		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.action === "LIST_RESPONSE") {
				setListTournament(data.value);
				console.log(data.value);
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
		setValidationButton(nameTournament.length >= 3);
	}, [nameTournament]);

	useEffect(() => {
		setValidationButton(() => {
			for (const tournament of listTournament) {
				if (tournament.id.toString() === idJoin)
					return true;
			}
			return false;
		})
	}, [idJoin])

	return (
		<div className="video-wrapper">
			<video
				className="bg-video"
				autoPlay
				muted
				loop
				disablePictureInPicture
				controlsList="nodownload noplaybackrate nofullscreen"
			>
				<source src="/images/menuPagevids.mp4" type="video/mp4" />
			</video>
			<div className="button-accueil">
				<button className="style-button-accueil" onClick={() => navigate('../')}>EXIT</button>
				<img src="/images/exit.png" className="img-exit"/>
			</div>
			<div className="page-menu-custom">
				<button className="Menu-button" onClick={SameKeyboard}>SameKeyboard</button>
				<button className="Menu-button" onClick={Solo}>Solo</button>
				<button className="Menu-button" onClick={MultiPlayers}>Multi Players</button>
				<button className="Menu-button" onClick={Tournament}>Tournament</button>
			</div>
			{showTournament && (
				<>
					<div className="popup">
						<table className="table-menu">
							<thead>
								<tr>
									<th className="th-menu">id</th>
									<th className="th-menu">Name</th>
									<th className="th-menu">Place</th>
								</tr>
							</thead>
							<tbody>
								{listTournament.map((tournament) => (
									<tr key={tournament.id}>
										<td className="td-menu">{tournament.id}</td>
										<td className="td-menu">{tournament.name}</td>
										<td style={{ color: tournament.isFull ? 'red' : '#39FF14' }}>{tournament.current}/{tournament.max}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div>
						<button className="button-tournament-create" onClick={Create}>Create</button>
						<button className="button-tournament-join" onClick={Join}>Join</button>
					</div>

					{validationButton && (
						<button className="button-validation" onClick={Validation}>Valider</button>
					)}
				</>
			)}

			{showCreate && (
				<div className="popup_create">
					<table className="table-menu">
						<thead>
							<tr>
								<th className="th-menu">Name</th>
								<th className="th-menu">size</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="td-menu">
									<input
										className="input-create"
										type="text"
										name="Tournament"
										onChange={(e) => setNameTournament(e.target.value)}
										placeholder="Entrez le nom"
										maxLength={20}
									/>
								</td>
								<td className="td-menu">
									<select
										name="Tournament"
										value={size}
										onChange={(e) => setSize(e.target.value)}
									>
										<option value="4">4 joueurs</option>
										<option value="8">8 joueurs</option>
										<option value="16">16 joueurs</option>
										<option value="32">32 joueurs</option>
									</select>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
			{showJoin && (
				<div className="popup_join">
					<table className="table-menu">
						<thead>
							<th className="th-menu">
								Join Tournament
							</th>
						</thead>
						<tbody>
							<tr>
								<td className="td-menu">
									<input
										className="input-join"
										type="text"
										placeholder="Entrer id"
										maxLength={5}
										onChange={(e) => setIdJoin(e.target.value)}
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				)}
		</div>
	);
};

export default GameMenu;
