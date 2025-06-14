import React, { useState, useEffect, useRef } from 'react';
import '../pong.css';
import { useNavigate } from 'react-router-dom';
import { Engine, Scene, Mesh, AbstractMesh, FreeCamera} from '@babylonjs/core';
import { initBabylon } from '../initBabylon';
import { Parse} from '../types/data';
import { handleKeyDown, handleKeyUp } from '../types/handleKey';

const Solo: React.FC = () => {
		const navigate = useNavigate();
		const returnMenu = () => socketRef.current?.send(JSON.stringify({type: "EXIT"}));			
		const returnMenuWinner = () => { navigate('/pong/menu')};
		
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
		const waitFrame = useRef<Parse[]>([]);
		
		const [isReady3d, setIsReady3d] = useState(false);
		const [isCinematic, setIscinematic] = useState(false);
		const [parsedData, setParsedData] = useState<Parse | null>(null);
		const [count, setCount] = useState(3);
		const [namePlayer1, setNamePlayer1] = useState();
		const [namePlayer2] = useState("Ironman");
		const [startReco, setStartReco] = useState(false);
		const [isPause, setIsPause] = useState(false);
		const [isWinner, setisWinner] = useState(false);
		const [nameWinner, setNameWinner] = useState<string | null>(null);
	
		const reconnection = localStorage.getItem("reconnection");
	
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
		// Initialisation Babylon + WebSocket
		useEffect(() => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			
			const socket = new WebSocket("wss://localhost:7000/pong");
			socketRef.current = socket;
	
			if (reconnection) {
				console.log("reco :", reconnection);
				if (reconnection === "Solo") {
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
					const directFrame = waitFrame.current.shift();
					if (directFrame)
						setParsedData(directFrame);
					scene.current?.render();
				});
				
				scene.current.executeWhenReady(() => {
					setIsReady3d(true);
				});
			};
			setup();
			socket.onmessage = (message: MessageEvent) => {
				const data = JSON.parse(message.data);			
				if (data.type === 'EXIT') {
					socket.close();
					engine.current?.dispose();
					localStorage.removeItem("reconnection");
					localStorage.removeItem("data");
					navigate('/pong/menu');
					return;
				}
				if (data.type === "Remove") {
					setStartReco(false);
					setIscinematic(false);
					localStorage.removeItem("reconnection");
					localStorage.removeItem("data");
	
				}
				if (data.type === "Pause") {
					setIsPause(data.value);
				}
				if (data.type === "FINISHED") {
					localStorage.removeItem("reconnection");
					localStorage.removeItem("data");
					setisWinner(true);
					if (parsedData?.player1.score === 21)
						setNameWinner(namePlayer1!)
					else					
						setNameWinner(namePlayer2)
					camera!.current!.position.x = 338.131;
					camera!.current!.position.y = 136.188;
					camera!.current!.position.z = -481.417;
					camera!.current!.rotation.x = 0.280;
					camera!.current!.rotation.y = -0.561;
				}
				if (data.ball && data.player1 && data.player2) {
					waitFrame.current.push(data)
					if (data.ball.pos_x < 778 && data.ball.pos_x > 775 
						|| data.ball.pos_x < 26 && data.ball.pos_x > 23) {
						if (!namePlayer1)
							setNamePlayer1(data.player1.userName);
						waitFrame.current.push(data)
					}	
					localStorage.setItem("data", JSON.stringify({
						...data, 
						camera: {
							pos_x: camera!.current!.position.x,
							pos_y: camera!.current!.position.y,
							pos_z: camera!.current!.position.z,
							rot_x: camera!.current!.rotation.x,
							rot_y: camera!.current!.rotation.y
					}}));
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
				// sessionStorage.setItem("inGame", "true");
				socketRef.current.send(JSON.stringify({ type: "Solo" }));
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
	
		// Ping pour maintenir la connexion WebSocket
		useEffect(() => {
			if (!isReady3d || !socketRef.current) return;
	
			const interval = setInterval(() => {
				if (socketRef.current?.readyState === WebSocket.OPEN) {
					socketRef.current.send(JSON.stringify({ type: 'Ping' }));
				}
			}, 5000);
			return () => clearInterval(interval);
		}, [isReady3d]);
	
		// Gestion des touches clavier
		useEffect(() => {
			if (!isReady3d || !socketRef.current || !isCinematic) return;
			const handlePause = (event: KeyboardEvent) => {
				if (event.key === ' ') {
					socketRef.current?.send(JSON.stringify({type: "Pause"}));
				}
			}
			window.addEventListener('keydown', handlePause)
			return (() => {
				window.removeEventListener('keydown', handlePause);
			})
		}, [isPause, isCinematic, isReady3d])
	
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
					socket.send(JSON.stringify({ type: "Move", value: "p1_down" }));
				else if (keyPressed.current.p1_up)
					socket.send(JSON.stringify({ type: "Move", value: "p1_up" }));
			}, 1000 / 60);
	
			return () => {
				window.removeEventListener('keydown', handleDown);
				window.removeEventListener('keyup', handleUp);
				clearInterval(interval);
			};
		}, [isReady3d, isCinematic]);
	
		useEffect(() => {
			if (!isReady3d || !socketRef.current || isCinematic) return;
			localStorage.setItem("reconnection", "Solo");
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
						camera.current.position.x = 130.38;
						camera.current.position.y = 32.81;
						camera.current.position.z = -1.33;
						camera.current.rotation.x = 0.478
						camera.current.rotation.y = -1.581;
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
						<h1 className="loading1">Loading ...</h1>
					</div>
				)}
				{/* jeu */}
					<div className="game-canvas">
						<canvas ref={canvasRef} className="game-canvas"/>
	
						 {/* jeu en pause */}
						{isPause && isReady3d && isCinematic && (
							<h1 className='Start-go'>
								[ Pause ]
							</h1>
						)}
	
						{/* Compte à rebours */}
						{!deleteGo.current && isCinematic && !startReco && (
							count > 0 
								? <h1 className="Start-go">{count}</h1>
								: <h1 className="Start-go">Go</h1>
						)}
	
						{/* Dashboard des scores et exit */}
						{isCinematic && !isWinner && (
							<>
								<h1 className="DashBoardp1">{!namePlayer1 ? "" : `${namePlayer1} : Score ${parsedData?.player1.score}`}</h1>
								<h1 className="DashBoardp2">{!namePlayer1 ? "" : `${namePlayer2} : Score ${parsedData?.player2.score}`}</h1>
								<button onClick={returnMenu} className="Return-button">Exit Game</button>
							</>
						)}
						{isWinner && (
							<>
								<h1 className='Winner'>Winner is {nameWinner}</h1>
								<button onClick={returnMenuWinner} className="Return-Menu">Return Menu</button>
							</>
						)}
	
					</div>
			</>
		);
	
};

export default Solo;