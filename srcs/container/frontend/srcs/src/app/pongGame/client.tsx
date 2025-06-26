import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './pong.css';

export const Pong: React.FC = () => {
	const navigate = useNavigate();

	const StartGame = () => { navigate('/pong/menu'); };

	return (
		<div className="page-custom">
			<h1 className="Title">IRONPONG</h1>
				<button className="start-button" onClick={StartGame}>Start Game</button>
		</div>
	);
};

export default Pong;
