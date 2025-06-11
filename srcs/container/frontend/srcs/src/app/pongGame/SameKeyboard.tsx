import React, { useState, useEffect, useRef } from 'react';
import './pong.css';
import { useNavigate } from 'react-router-dom';
import { Engine, Scene, Mesh, AbstractMesh, FreeCamera} from '@babylonjs/core';
import { initBabylon } from './initBabylon';
import { Parse} from './types/data';
import { handleKeyDown, handleKeyUp } from './types/handleKey';

const SameKeyboard: React.FC = () => {
	const navigate = useNavigate();
	const returnMenu = () => socketRef.current?.send(JSON.stringify({type: "EXIT"}));
	
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
	const [isReady3d, setIsReady3d] = useState(false);
	const [isCinematic, setIscinematic] = useState(false);
	const [parsedData, setParsedData] = useState<Parse | null>(null);
	const [count, setCount] = useState(3);
	const [namePlayer1] = useState("Player1");
	const [namePlayer2] = useState("Player2");
	
	const keyPressed = useRef({
		p1_up: false,
		p1_down: false,
		p2_up: false,
		p2_down: false
	});
	
	// Initialisation Babylon + WebSocket
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		
		const socket = new WebSocket("wss://localhost:7000/pong");
		socketRef.current = socket;
		
		const inGame = sessionStorage.getItem("inGame");
		if (inGame === "true") {
			sessionStorage.removeItem("inGame");
			navigate('/pong/menu');
			return;
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
			if (data.type === 'EXIT') {
				socket.close();
				engine.current?.dispose();
				sessionStorage.removeItem("inGame");
				navigate('/pong/menu');
				return;
			}
			if (data.ball && data.player1 && data.player2)
				setParsedData(data);
		};
		// Nettoyage
		return () => {
			engine.current?.dispose();
			socket.close();
		};
	}, []);
	
	useEffect(() => {
		if (!isReady3d || !socketRef.current || !isCinematic) return;
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
			sessionStorage.setItem("inGame", "true");
			socketRef.current.send(JSON.stringify({ type: "SameKeyboard" }));
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

			if (keyPressed.current.p2_down)
				socket.send(JSON.stringify({ type: "Move", value: "p2_down" }));
			else if (keyPressed.current.p2_up)
				socket.send(JSON.stringify({ type: "Move", value: "p2_up" }));
		}, 1000 / 60);

		return () => {
			window.removeEventListener('keydown', handleDown);
			window.removeEventListener('keyup', handleUp);
			clearInterval(interval);
		};
	}, [isReady3d, isCinematic]);

	useEffect(() => {
		if (!isReady3d || !socketRef.current || isCinematic) return;
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
					camera.current.position.x = 71.376;
					camera.current.position.y = 91.805;
					camera.current.position.z = -67.399;
					camera.current.rotation.x = 0.908;
					camera.current.rotation.y = -0.136;
					clearInterval(interval);
					setIscinematic(true)
				}
				else
					i++;
			}, 6);
	}, [isReady3d])

	return (
		<div className='game-canvas'>
			<canvas ref={canvasRef} className="game-canvas" />
			{!deleteGo.current && isCinematic && (count > 0 
				?	<h1 className='Start-go'>{count}</h1>
				:	<h1 className='Start-go'>Go</h1>
			)}
			{isCinematic && (
			<>
				<h1 className='DashBoardp1'>{namePlayer1} : Score {parsedData?.player1.score}</h1>
				<h1 className='DashBoardp2'>{namePlayer2} : Score {parsedData?.player2.score}</h1>
			</>
			)}
			<button onClick={returnMenu} className='Return-button'>Exit Game</button>
		</div>
	);
};

export default SameKeyboard;
