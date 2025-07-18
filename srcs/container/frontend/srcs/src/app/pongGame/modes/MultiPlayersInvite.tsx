import React, { useState, useEffect, useRef } from 'react';
import '../pong.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Engine, Scene, Mesh, AbstractMesh, FreeCamera } from '@babylonjs/core';
import { initBabylon } from '../initBabylon';
import { Parse } from '../types/data';
import { handleKeyDown, handleKeyUp } from '../types/handleKey';
import ApiService from '../../../api/ApiService';
import { useLanguage } from '../../../contexts/LanguageContext';


const MultiPlayersInvite: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const returnMenu = () => socketRef.current?.send(JSON.stringify({ type: "EXIT", value: assignPlayer }));
	const returnMenuWinner = () => {
		navigate(-1)
		localStorage.removeItem("reconnection");
		localStorage.removeItem("data");
		engine.current?.dispose();
	};

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const paddle1 = useRef<Mesh | null>(null);
	const paddle2 = useRef<Mesh | null>(null);
	const galactic = useRef<AbstractMesh | null>(null);
	const camera = useRef<FreeCamera | null>(null);
	const ball = useRef<Mesh | null>(null);
	const scene = useRef<Scene | null>(null);
	const engine = useRef<Engine | null>(null);
	const socketRef = useRef<WebSocket | null>(null);
	const deleteGo = useRef(false);
	const nameWinner = useRef<string | null>(null);
	const namePlayer1 = useRef<string | null>(null);
	const namePlayer2 = useRef<string | null>(null);
	const assignPlayer = useRef<"p1" | "p2" | null>(null);
	const [isReady3d, setIsReady3d] = useState(false);
	const [isCinematic, setIscinematic] = useState(false);
	const [parsedData, setParsedData] = useState<Parse | null>(null);
	const [count, setCount] = useState(3);
	const [startReco, setStartReco] = useState(false);
	const [isWinner, setisWinner] = useState(false);
	const [waitingPlayers, setWaitingPlayers] = useState(false);
	const [isPause, setIsPause] = useState(false);
	const [player1Avatar, setPlayer1Avatar] = useState<string | undefined>(undefined);
	const [player2Avatar, setPlayer2Avatar] = useState<string | undefined>(undefined);

	const {t} = useLanguage();
	const [messagePause, setMessagePause] = useState(t("pong.multi.pause"));


	const data = searchParams.get('data');
	const reconnection = localStorage.getItem("reconnection");
	if (!data && !reconnection) {
		returnMenuWinner();
	}

	const keyPressed = useRef({
		p1_up: false,
		p1_down: false,
		p2_up: false,
		p2_down: false,
	});

	function restoreCamera(data: any) {
		camera.current!.position.x = data.camera.pos_x;
		camera.current!.position.y = data.camera.pos_y;
		camera.current!.position.z = data.camera.pos_z;
		camera.current!.rotation.x = data.camera.rot_x;
		camera.current!.rotation.y = data.camera.rot_y;

	}

	useEffect(() => {
		if (!reconnection && data && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify({ type: "MultiInvite", data }));
		}
	}
		, [socketRef.current]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;

		if (reconnection) {
			if (reconnection === "MultiPlayersInvite") {
				setIscinematic(true);
				setStartReco(true);
				setIsPause(true);
			}
			else {
				localStorage.removeItem("reconnection")
				localStorage.removeItem("data")
			}
		}
		const setup = async () => {

			const result = await initBabylon(canvas);
			window.addEventListener("resize", () => engine.current?.resize());

			engine.current = result.engine;
			scene.current = result.scene;
			ball.current = result.ball;
			paddle1.current = result.paddle1;
			paddle2.current = result.paddle2;
			galactic.current = result.galactic;
			camera.current = result.camera;


			engine.current.runRenderLoop(() => {
				galactic.current!.rotation.z += 0.0002;
				galactic.current!.rotation.y += 0.0002;
				scene.current?.render();
			});

			scene.current.executeWhenReady(() => {
				setIsReady3d(true);
			});
		};
		setup();
		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.type === 'redirect') {
				navigate(data.url);
				localStorage.removeItem("reconnection");
				localStorage.removeItem("data");
				return;
			}
			if (data.type === 'EXIT') {
				socket.close();
				engine.current?.dispose();
				localStorage.removeItem("reconnection");
				localStorage.removeItem("data");
				navigate(-1);
				return;
			}
			if (data.type === "Remove") {
				setStartReco(false);
				setIscinematic(false);
				setIsPause(false);
				localStorage.removeItem("reconnection");
				localStorage.removeItem("data");

			}
			if (data.type === "Pause") {
				setIsPause(data.value);
				if (data.message) {
					if (data.message === "Press [ ESP ] for PLAY")
						setMessagePause(t("pong.multi.pause"));
					else if (data.message === "Adversaire en pause. Reprise imminente.")
						setMessagePause(t("pong.multi.pausead"));
				}
			}
			if (data.type === "assign") {
				assignPlayer.current = data.value;
				if (assignPlayer.current === "p2" && camera.current) {
					camera.current.position.x = -19.203;
					camera.current.position.y = 28.187;
					camera.current.position.z = -0.804;
					camera.current.rotation.x = 0.363
					camera.current.rotation.y = 1.570;
				}
				else if (assignPlayer.current === "p1" && camera.current) {
					camera.current.position.x = 130.38;
					camera.current.position.y = 32.81;
					camera.current.position.z = -1.33;
					camera.current.rotation.x = 0.478
					camera.current.rotation.y = -1.581;
				}
				setWaitingPlayers(true);
			}
			if (data.type === "FINISHED") {
				localStorage.removeItem("reconnection");
				localStorage.removeItem("data");
				if (data.value === "win") {
					if (assignPlayer.current === "p1")
						nameWinner.current = namePlayer1!.current
					else
						nameWinner.current = namePlayer2!.current
				}
				else {
					if (assignPlayer.current === "p1")
						nameWinner.current = namePlayer2!.current
					else
						nameWinner.current = namePlayer1!.current
				}

				setisWinner(true);
				camera!.current!.position.x = 338.131
				camera!.current!.position.y = 136.188;
				camera!.current!.position.z = -481.417;
				camera!.current!.rotation.x = 0.280;
				camera!.current!.rotation.y = -0.561;
				socket.close();
			}
			if (data.ball && data.player1 && data.player2) {
			if (!player1Avatar)
				setPlayer1Avatar(ApiService.getFile(data.player1.avatar))
			if (!player2Avatar)
				setPlayer2Avatar(ApiService.getFile(data.player2.avatar))
			if (!namePlayer1.current) {
				namePlayer1.current = (data.player1.userName);
			}
				setParsedData(data)

				if (!namePlayer1.current) {
					namePlayer1.current = (data.player1.userName);
				}
				if (!namePlayer2.current)
					namePlayer2.current = data.player2.userName;
				localStorage.setItem("data", JSON.stringify({
					...data,
					camera: {
						pos_x: camera!.current!.position.x,
						pos_y: camera!.current!.position.y,
						pos_z: camera!.current!.position.z,
						rot_x: camera!.current!.rotation.x,
						rot_y: camera!.current!.rotation.y
					}
				}));
			}
		};
		// Nettoyage
		return () => {
			engine.current?.dispose();
			socket.close();
		};
	}, []);


	useEffect(() => {
		if (!isReady3d || !socketRef.current || !isCinematic) return;
		if (startReco) {
			const saveData = localStorage.getItem("data");
			if (saveData) {
				const data = JSON.parse(saveData);
				restoreCamera(data);
				setParsedData(data);
				setWaitingPlayers(true);
			}
			return;
		}
		if (count > 0) {
			const timeout = setTimeout(() => {
				setCount((count) => count - 1);
			}, 1000);
			return () => clearTimeout(timeout);
		}
		if (count === 0 && socketRef.current?.readyState === WebSocket.OPEN) {
			const goTimeout = setTimeout(() => {
				deleteGo.current = true;
				return () => clearTimeout(goTimeout);
			}, 500);
			socketRef.current.send(JSON.stringify({ type: "MultiInvite", data, action: "Start" }));
		}
	}, [isReady3d, isCinematic, count]);

	// Mise à jour des positions
	useEffect(() => {
		if (!ball.current || !parsedData || !isReady3d || !isCinematic) return;

		const pixelWidth = 800, pixelHeight = 600;
		const worldLeft = 19, worldRight = 99;
		const worldUp = 30, worldDown = -30;
		const paddleUp = 30, paddleDown = -30;

		ball.current.position.x = worldLeft + (parsedData.ball.pos_x * (worldRight - worldLeft)) / pixelWidth;
		ball.current.position.z = worldUp - (parsedData.ball.pos_y * (worldUp - worldDown)) / pixelHeight;

		paddle1.current!.position.z = paddleUp - ((parsedData.player2.pos_y + 50) * (paddleUp - paddleDown)) / pixelHeight;
		paddle2.current!.position.z = paddleUp - ((parsedData.player1.pos_y + 50) * (paddleUp - paddleDown)) / pixelHeight;
	}, [parsedData, isReady3d, isCinematic]);

	useEffect(() => {
		if (!isReady3d || !socketRef.current) return;

		const interval = setInterval(() => {
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				socketRef.current.send(JSON.stringify({ type: 'Ping' }));
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [isReady3d]);

	useEffect(() => {
		if (!isReady3d || !socketRef.current || !isCinematic || !waitingPlayers) return;
		const handlePause = (event: KeyboardEvent) => {
			if (event.key === ' ') {
				socketRef.current?.send(JSON.stringify({ type: "Pause" }));
			}
		}
		window.addEventListener('keydown', handlePause)
		return (() => {
			window.removeEventListener('keydown', handlePause);
		})
	}, [isPause, isCinematic, isReady3d, waitingPlayers])

	useEffect(() => {
		if (!isReady3d || !socketRef.current || !isCinematic) return;

		const handleDown = (event: KeyboardEvent) => handleKeyDown(event, keyPressed.current, camera.current!);
		const handleUp = (event: KeyboardEvent) => handleKeyUp(event, keyPressed.current);

		window.addEventListener('keydown', handleDown);
		window.addEventListener('keyup', handleUp);

		const interval = setInterval(() => {
			const socket = socketRef.current;
			if (!socket || socket.readyState !== WebSocket.OPEN) return;
			if (keyPressed.current.p1_down)
				socket.send(JSON.stringify({ type: "Move", value: `${assignPlayer.current}_down` }));
			else if (keyPressed.current.p1_up)
				socket.send(JSON.stringify({ type: "Move", value: `${assignPlayer.current}_up` }));
		}, 1000 / 60);

		return () => {
			window.removeEventListener('keydown', handleDown);
			window.removeEventListener('keyup', handleUp);
			clearInterval(interval);
		};
	}, [isReady3d, isCinematic]);

	useEffect(() => {
		if (!isReady3d || !socketRef.current || isCinematic) return;
		localStorage.setItem("reconnection", "MultiPlayersInvite");
		let i: number = -1209
		camera.current!.rotation.x = 0.081;
		camera.current!.rotation.y = 1.599;
		camera.current!.position.y = 21.71;
		camera.current!.position.z = -1.446;
		const interval = setInterval(() => {
			if (!camera.current) return;
			if (i <= - 21) {
				camera.current.position.x = i;
				i++;
			}
			else if (i >= 200) {
				camera.current.position.x = 338.131;
				camera.current.position.y = 136.188;
				camera.current.position.z = -481.417;
				camera.current.rotation.x = 0.280;
				camera.current.rotation.y = -0.561;
				clearInterval(interval);
				setIscinematic(true)
			}
			else
				i++;
		}, 6);
	}, [isReady3d])

	return (
		<>
			{/* Loading plein écran */}
			{!isReady3d && (
				<div>
					<h1 className="loading1">{t("pong.multi.loading")}</h1>
				</div>
			)}
			{/* jeu */}
			<div className="game-canvas">
				<canvas ref={canvasRef} className="game-canvas" />

				{/* jeu en pause */}
				{isPause && isReady3d && isCinematic && !isWinner && (
					<h1 className='Start-go'>
						{messagePause}
					</h1>
				)}

				{/* Compte à rebours */}
				{!deleteGo.current && isCinematic && !startReco && waitingPlayers && (
					count > 0
						? <h1 className="Start-go">{count}</h1>
						: <h1 className="Start-go">{t("pong.multi.go")}</h1>
				)}

				{/* waiting Players */}
				{isCinematic && !startReco && !waitingPlayers && (
					<>
						<h1 className='Start-go' > {t("pong.multi.attenteplayer")} </h1>
					</>
				)}
				{/* Dashboard des scores et exit */}
				{isCinematic && !isWinner && (
								<>
									<h1 className="DashBoardp1">{!namePlayer1.current ? "" : `${namePlayer1.current}`}</h1>
									<h1 className='DashScore1'>{!namePlayer1.current ? "" : `${parsedData?.player1.score}`}</h1>
										{!namePlayer1.current ? (
											""
											) : (
											<div className='popup-avatar1'>
												<img src={player1Avatar} alt="Avatar"/>
											</div>
											)}
									<h1 className="DashBoardp2">{!namePlayer2.current ? "" : `${namePlayer2.current}`}</h1>
									<h1 className='DashScore2'>{!namePlayer2.current ? "" : `${parsedData?.player2.score}`}</h1>
										{!namePlayer2.current ? (
											""
											) : (
											<div className='popup-avatar2'>
												<img src={player2Avatar} alt="Avatar"/>
											</div>
											)}
						<button onClick={returnMenu} className="Return-button">{t("pong.multi.exitgame")}</button>
					</>
				)}
				{isWinner && (
					<>
						<h1 className='Winner'>{t("pong.multi.winner")} {nameWinner.current}</h1>
						<button onClick={returnMenuWinner} className="Return-Menu">{t("pong.multi.returnmenu")}</button>
					</>
				)}

			</div>
		</>
	);
};

export default MultiPlayersInvite;