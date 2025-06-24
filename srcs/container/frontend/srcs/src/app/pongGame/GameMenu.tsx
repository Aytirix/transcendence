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
		socketRef.current?.send(JSON.stringify({
			type: "Tournament",
			action: "Create",
			value: nameTournament,
			sizeTournament: size
		}));
		setValidationButton(false);
		setShowCreate(false);
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
		const socket = new WebSocket("wss://localhost:7000/pong");
		socketRef.current = socket;

		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.type === "Display") {
				setListTournament(data.list);
				console.log(data.list);
			}
		};
	}, []);

	useEffect(() => {
		setValidationButton(nameTournament.length >= 3);
	}, [nameTournament]);

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

			<div className="page-menu-custom">
				<button className="Menu-button" onClick={SameKeyboard}>SameKeyboard</button>
				<button className="Menu-button" onClick={Solo}>Solo</button>
				<button className="Menu-button" onClick={MultiPlayers}>Multi Players</button>
				<button className="Menu-button" onClick={Tournament}>Tournament</button>
			</div>

			{showTournament && (
				<>
					<div className="popup">
						<table>
							<thead>
								<tr>
									<th>id</th>
									<th>Name</th>
									<th>Place</th>
								</tr>
							</thead>
							<tbody>
								{listTournament.map((tournament) => (
									<tr key={tournament.idTournament}>
										<td>{tournament.idTournament}</td>
										<td>{tournament.name}</td>
										<td style={{ color: tournament.isFull ? 'red' : '#39FF14' }}>{tournament.nbPlayer}/{tournament.size}</td>
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
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>size</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									<input
										type="text"
										name="Tournament"
										onChange={(e) => setNameTournament(e.target.value)}
										placeholder="Entrez le nom"
										maxLength={20}
									/>
								</td>
								<td>
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
					<table>
						<thead>
							<th>
								Join Tournament
							</th>
						</thead>
						<tbody>
							<tr>
								<td>
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
