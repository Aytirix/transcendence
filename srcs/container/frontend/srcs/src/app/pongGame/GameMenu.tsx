import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Tournament, userStatsPong } from "./types/data";
import { useLanguage } from "../../contexts/LanguageContext";
import ApiService from "../../api/ApiService";


const GameMenu: React.FC = () => {
	const [statistique, setStatistique] = useState<userStatsPong | undefined>(undefined);	
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
	const [showParametre, setShowparametre] = useState(false);
	const [showStatistique, setShowStatistique] = useState(false);
	

	const SameKeyboard = () => navigate('/pong/menu/SameKeyboard');
	const Solo = () => navigate('/pong/menu/Solo');
	const MultiPlayers = () => navigate('/pong/menu/MultiPlayers');
	
	const {t} = useLanguage();
	
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

	const Statistiques = () => {
		if (!showStatistique){
			if (!showTournament)
				setShowStatistique(true);
			if (!showParametre)
				setShowStatistique(true);
			if (showTournament) {
				setShowTournament(false);
				setShowJoin(false);
				setShowCreate(false)
				setShowparametre(false);
				setShowStatistique(true)
			}
			if (showParametre) {
				setShowTournament(false);
				setShowJoin(false);
				setShowCreate(false)
				setShowparametre(false);
				setShowStatistique(true)
			}
		}
		else
			setShowStatistique(false);
	}

	const Parametre = () => {
		if (!showParametre) {
			if (!showTournament)
				setShowparametre(true);
			if (!showStatistique)
				setShowparametre(true)
			if (showTournament) {
				setShowTournament(false);
				setShowJoin(false);
				setShowCreate(false)
				setShowparametre(true);
				setShowStatistique(false)
			}
			if (showStatistique) {
				setShowTournament(false);
				setShowJoin(false);
				setShowCreate(false)
				setShowparametre(true);
				setShowStatistique(false)
			}
		}
		else
			setShowparametre(false);
	};
	
	const Tournament = () => {
		if (showTournament) {
			setShowTournament(false);
			setShowCreate(false);
			setValidationButton(false);
			setShowJoin(false);
			setShowStatistique(false)
		} else {
			setShowTournament(true);
			if (showParametre)
				setShowparametre(false);
			if (showStatistique)
				setShowStatistique(false)
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
		if (showJoin) {
			setShowJoin(false);
			setValidationButton(false)
			setIdJoin("");
		}
		else
			setShowJoin(true);
	}

	useEffect(() => {
		const fetchStat = async () => {
			const result : userStatsPong = await ApiService.get("/pong/getStatistics")
			if (result.ok) {
				setStatistique(result);
			}
		}
		fetchStat();
	}, [])
	
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;

		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.action === "LIST_RESPONSE") {
				setListTournament(data.value);
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
				if (tournament.id.toString() === idJoin && !tournament.isFull)
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
				<button className="style-button-accueil" onClick={() => navigate('../')}>{t("pong.gamemenu.exit")}</button>
				<img src="/images/exit.png" className="img-exit"/>
			</div>
			<div className="page-menu-custom">
				<button className="Menu-button" onClick={SameKeyboard}>{t("pong.gamemenu.samekeyboard")}</button>
				<button className="Menu-button" onClick={Solo}>{t("pong.gamemenu.solo")}</button>
				<button className="Menu-button" onClick={MultiPlayers}>{t("pong.gamemenu.multi")}</button>
				<button className="Menu-button" onClick={Tournament}>{t("pong.gamemenu.tournament")}</button>
				<button className="Menu-button" onClick={Statistiques}>{t("pong.gamemenu.statistiques")}</button>
			</div>
			<div className="parametre">
				<button className="style-button-accueil" onClick={Parametre}> {t("pong.gamemenu.parametres")}</button>
			</div>
			{showTournament && (
				<>
					<div className="popup">
						<table className="table-menu">
							<thead>
								<tr>
									<th className="th-menu">id</th>
									<th className="th-menu">{t("pong.gamemenu.name")}</th>
									<th className="th-menu">{t("pong.gamemenu.place")}</th>
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
						<button className="button-tournament-create" onClick={Create}>{t("pong.gamemenu.create")}</button>
						<button className="button-tournament-join" onClick={Join}>{t("pong.gamemenu.join")}</button>
					</div>

					{validationButton && (
						<button className="button-validation" onClick={Validation}>{t("pong.gamemenu.valider")}</button>
					)}
				</>
			)}
			{showParametre && (
				<div className="popup">
					<table className="table-menu">
					<thead>
						<tr>
						<th className="th-menu" colSpan={2}>{t("pong.parametre.cmd")}</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>1 → 4</td><td>{t("pong.parametre.chgvue")}</td></tr>
						<tr><td>{t("pong.parametre.esp")}</td><td>{t("pong.parametre.pause")}</td></tr>
					</tbody>

					<thead>
						<tr>
						<th className="th-menu" colSpan={2}>{t("pong.parametre.samekeyboard")}</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>← / →</td><td>{t("pong.parametre.joueur1")}</td></tr>
						<tr><td>a / d</td><td>{t("pong.parametre.joueur2")}</td></tr>
					</tbody>

					<thead>
						<tr>
						<th className="th-menu" colSpan={2}>{t("pong.parametre.solo")}</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>← / →</td><td>{t("pong.parametre.raquette")}</td></tr>
					</tbody>

					<thead>
						<tr>
						<th className="th-menu" colSpan={2}>{t("pong.parametre.multi")}</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>← / →</td><td>{t("pong.parametre.raquette")}</td></tr>
					</tbody>
					</table>
				</div>
			)}
			{showStatistique && statistique && (
				<div className="popup">
					<h2 className="text-2xl font-bold text-center mb-4 th-menu">{t("pong.gamemenu.statistiques")}</h2>
					<table className="w-full text-lg table-fixed">
						<tbody>
							<tr className="border-b border-gray-300">
								<td className="w-1/2 font-semibold">{t("pong.gamemenu.victoires")}</td>
								<td className="text-right text-green-500">
									{statistique.total.victoire} ({statistique.total.victoirePour100.toFixed(1)}%)
								</td>
							</tr>
							<tr className="border-b border-gray-300">
								<td className="font-semibold">{t("pong.gamemenu.defaites")}</td>
								<td className="text-right text-red-500">
									{statistique.total.defaite} ({statistique.total.defaitePour100.toFixed(1)}%)
								</td>
							</tr>
							<tr className="border-b border-gray-300">
								<td className="font-semibold">{t("pong.gamemenu.abandons")}</td>
								<td className="text-right text-yellow-500">
									{statistique.total.abandon} ({statistique.total.abandonPour100.toFixed(1)}%)
								</td>
							</tr>

							<tr className="border-t border-gray-400 mt-2">
								<td className="pt-2 font-semibold">{t("pong.gamemenu.tournoisgagnes")}</td>
								<td className="text-right pt-2">{statistique.tournamentVictory}</td>
							</tr>
							<tr>
								<td className="font-semibold">{t("pong.gamemenu.partiesjoue")}</td>
								<td className="text-right">{statistique.total.nbParti}</td>
							</tr>

							{/* SOLO */}
							<tr><td colSpan={2} className="pt-2 font-semibold text-blue-200 uppercase">{t("pong.gamemenu.solo")}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.partiesjoue")}</td><td className="text-right">{statistique.Solo.nbParti}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.victoires")}</td><td className="text-right text-green-500">{statistique.Solo.victoire} ({statistique.Solo.victoirePour100.toFixed(1)}%)</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.defaites")}</td><td className="text-right text-red-500">{statistique.Solo.defaite} ({statistique.Solo.defaitePour100.toFixed(1)}%)</td></tr>
							<tr className="border-b border-gray-300"><td className="pl-2">{t("pong.gamemenu.abandons")}</td><td className="text-right text-yellow-500">{statistique.Solo.abandon} ({statistique.Solo.abandonPour100.toFixed(1)}%)</td></tr>

							{/* MULTI */}
							<tr><td colSpan={2} className="pt-2 font-semibold text-blue-200 uppercase">{t("pong.gamemenu.multi")}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.partiesjoue")}</td><td className="text-right">{statistique.Multi.nbParti}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.victoires")}</td><td className="text-right text-green-500">{statistique.Multi.victoire} ({statistique.Multi.victoirePour100.toFixed(1)}%)</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.defaites")}</td><td className="text-right text-red-500">{statistique.Multi.defaite} ({statistique.Multi.defaitePour100.toFixed(1)}%)</td></tr>
							<tr className="border-b border-gray-300"><td className="pl-2">{t("pong.gamemenu.abandons")}</td><td className="text-right text-yellow-500">{statistique.Multi.abandon} ({statistique.Multi.abandonPour100.toFixed(1)}%)</td></tr>

							{/* TOURNAMENT */}
							<tr><td colSpan={2} className="pt-2 font-semibold text-blue-200 uppercase">{t("pong.gamemenu.tournament")}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.partiesjoue")}</td><td className="text-right">{statistique.Tournament.nbParti}</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.victoires")}</td><td className="text-right text-green-500">{statistique.Tournament.victoire} ({statistique.Tournament.victoirePour100.toFixed(1)}%)</td></tr>
							<tr><td className="pl-2">{t("pong.gamemenu.defaites")}</td><td className="text-right text-red-500">{statistique.Tournament.defaite} ({statistique.Tournament.defaitePour100.toFixed(1)}%)</td></tr>
							<tr className="border-b border-gray-300"><td className="pl-2">{t("pong.gamemenu.abandons")}</td><td className="text-right text-yellow-500">{statistique.Tournament.abandon} ({statistique.Tournament.abandonPour100.toFixed(1)}%)</td></tr>

							{/* Same keyboard */}
							<tr><td className="pt-2 font-semibold">{t("pong.gamemenu.samekeyboard")}</td><td className="text-right">{statistique.SameKeyboard.nbParti} {t("pong.gamemenu.parties")}</td></tr>

							{/* Derniers matchs */}
							<tr>
								<td className="pt-4 font-semibold" colSpan={2}>{t("pong.gamemenu.lastfive")}</td>
							</tr>
							{statistique.lastFive.length > 0 ? (
								statistique.lastFive.map((match, index) => (
									<tr key={index} className="border-b border-gray-200">
										<td className="text-sm  text-blue-200 uppercase">{t("pong.gamemenu.mode")} {t(`pong.gamemenu.${match.mode}`)} {match.opponentName}</td>
										<td className="text-sm text-right">
											{match.date} – 
											<span className={
												match.status === "Victoire" ? "text-green-500" :
												match.status === "Défaite" ? "text-red-500" :
												"text-yellow-500"
											}>
												{`${t(`pong.gamemenu.${match.status}`)}`}
											</span>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={2} className="text-center text-gray-400">{t("pong.gamemenu.aucunmatch")}</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
			{showCreate && (
				<div className="popup_create">
					<table className="table-menu">
						<thead>
							<tr>
								<th className="th-menu">{t("pong.gamemenu.name")}</th>
								<th className="th-menu">{t("pong.gamemenu.size")}</th>
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
										placeholder={t("pong.gamemenu.entrernom")}
										maxLength={20}
									/>
								</td>
								<td className="td-menu">
									<select
										name="Tournament"
										value={size}
										onChange={(e) => setSize(e.target.value)}
									>
										<option value="4" style={{ color: "black" }}>4 {t("pong.gamemenu.joueurs")}</option>
										{/* <option value="8">8 {t("pong.gamemenu.joueurs")}</option> */}
										{/* <option value="16">16 {t("pong.gamemenu.joueurs")}</option> */}
										{/* <option value="32">32 {t("pong.gamemenu.joueurs")}</option> */}
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
								{t("pong.gamemenu.jointournament")}
							</th>
						</thead>
						<tbody>
							<tr>
								<td className="td-menu">
									<input
										className="input-join"
										type="text"
										placeholder={t("pong.gamemenu.entrerid")}
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
