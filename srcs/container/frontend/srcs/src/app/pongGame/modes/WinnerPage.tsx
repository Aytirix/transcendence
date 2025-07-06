import React, { useState, useEffect, useRef } from 'react';
import '../pong.css';


const WinnerPage: React.FC = () => {
	const socketRef = useRef<WebSocket | null>(null);
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;
	
		socket.onmessage = (message: MessageEvent) => {
		const data = JSON.parse(message.data);
	
		}
	}, [])
	return(
		<div className='WinnerPage'>
			<div className='popup-WinnerPage'>
				<div className='avatar-Winner'></div>
				<img src="/images/logomarvel.png" alt="logo" className='img-logo'/>
			</div>
				<img src="/images/certificat.png" alt="certificat" className='img-certificat'/>
		</div>
	);
};
export default WinnerPage;