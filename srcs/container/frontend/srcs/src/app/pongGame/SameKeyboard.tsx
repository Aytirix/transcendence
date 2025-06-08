import React, { useState } from 'react';
import './pong.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Engine, Scene, Mesh, AbstractMesh } from '@babylonjs/core';
import { initBabylon } from './initBabylon';
import { Parse } from './types/data';
import { handleKeyDown, handleKeyUp } from './types/handleKey';

const SameKeyboard: React.FC = () => {
	const navigate = useNavigate();
	const returnMenu = () => {navigate('/pong/menu'); };
	const canvasRef = useRef<HTMLCanvasElement | null> (null);
	const paddle1 = useRef<Mesh | null> (null);
	const paddle2 = useRef<Mesh | null> (null);
	const galactic = useRef<AbstractMesh | null> (null);
	const ball = useRef<Mesh | null> (null);
	const scene = useRef<Scene | null> (null);
	const engine = useRef<Engine | null> (null);
	const socketRef = useRef<WebSocket | null> (null);
	const [parsedData, setParsedData] = useState<Parse | null> (null);
	const keyPressed = useRef({
		p1_up: false,
		p1_down: false,
		p2_up: false,
		p2_down: false
	});
	
	useEffect(() => {
		const canvas = canvasRef.current;
		socketRef.current = new WebSocket("wss://localhost:7000/pong");
		if (!canvas) return;
		const setup = async () => {
			const result = await initBabylon(canvas);
			window.addEventListener("resize", () => {
				engine.current?.resize();
				});
			engine.current = result.engine;
			scene.current = result.scene;
			ball.current = result.ball;
			paddle1.current = result.paddle1;
			paddle2.current = result.paddle2
			galactic.current = result.galactic
			engine.current?.runRenderLoop(() => {
				galactic.current!.rotation.z += 0.0002;
				galactic.current!.rotation.y += 0.0002;
				scene.current?.render();
			});
		};
		setup();
		// lancement de la partie SameKeyboard pour le backend
		socketRef.current.onopen = () => {
			socketRef.current?.send(JSON.stringify({type: "SameKeyboard"}));
		}
		socketRef.current.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.ball && data.player1 && data.player2)
				setParsedData(data);
			else if (data.type === "pong") {return;}
		}
		return () => {
			engine.current?.dispose();
		};
	}, []);


	useEffect(() => {
		if (!ball.current || !parsedData) return;
		const pixelWidth = 800; // largeur du backend
		const worldLeft = 19;   // bord gauche du terrain 3D
		const worldRight = 99;  // bord droit du terrain 3D

		const pixelHeight = 600; // largeur du backend
		const worldUp = 30;   // haut du terrain 3D
		const worldDown = - 30;  // bas du terrain 3D

		const paddle1Up = 30;
		const paddle1Down = -30;

		const paddle2Up = 30;
		const paddle2Down = -30;

		ball.current.position.x = worldLeft + (parsedData.ball.pos_x * (worldRight - worldLeft)) / pixelWidth;
		ball.current.position.z = worldUp - (parsedData.ball.pos_y * (worldUp - worldDown)) / pixelHeight;
		paddle1.current!.position.z = paddle1Up - ((parsedData.player2.pos_y + 50) * (paddle1Up - paddle1Down)) / pixelHeight;
		paddle2.current!.position.z = paddle2Up - ((parsedData.player1.pos_y + 50) * (paddle2Up - paddle2Down)) / pixelHeight;
	}, [parsedData, setParsedData]);


	useEffect(() => {
		const interval = setInterval(() => {
			const socket = socketRef.current;
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: 'Ping' }));
			}
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const handleDown = (event: KeyboardEvent) => handleKeyDown(event, keyPressed.current);
		const handleUp = (event: KeyboardEvent) => handleKeyUp(event, keyPressed.current);
		
		window.addEventListener('keydown', handleDown)
		window.addEventListener('keyup', handleUp)
		const interval = setInterval(() => {
			if (keyPressed.current.p1_down)
				socketRef.current?.send(JSON.stringify({type: "Move", value: "p1_down"}));
			else if (keyPressed.current.p1_up)
				socketRef.current?.send(JSON.stringify({type: "Move", value: "p1_up"}));
			if (keyPressed.current.p2_down)
				socketRef.current?.send(JSON.stringify({type: "Move", value: "p2_down"}));
			else if (keyPressed.current.p2_up)
				socketRef.current?.send(JSON.stringify({type: "Move", value: "p2_up"}));
		}, 1000 / 60);
		return () => {
			window.removeEventListener('keydown', handleDown);
			window.removeEventListener('keyup', handleUp);
			clearInterval(interval);
		};
	}, []);
	
	return (
		<div className='game-canvas'>
			<canvas ref={canvasRef} className="game-canvas" />
			<button onClick={returnMenu}>Return Menu</button>
		</div>
	);
};

export default SameKeyboard;