import React, { useState, useEffect, useRef } from 'react';
import '../pong.css';
import ApiService from '../../../api/ApiService';


const WinnerPage: React.FC = () => {
	const socketRef = useRef<WebSocket | null>(null);
	const [dataPlayer, setDataplayer] = useState<{name: string, avatar: string}>();
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;
	
		socket.onmessage = (message: MessageEvent) => {
		const data = JSON.parse(message.data);
		if (data.type === "data") {
			setDataplayer(data.value);
		}
	
		}
	}, [])
	return(
		<div className='WinnerPage'>
			<div className='popup-WinnerPage'>
				<h1 className="name-winner">{dataPlayer?.name}</h1>
				<div className='avatar-Winner'>
					<img src={ApiService.getFile(dataPlayer?.avatar)} alt="Avatar" className="w-full h-full object-cover rounded-[20px]"/>
				</div>
				<img src="/images/logomarvel.png" alt="logo" className='img-logo'/>
			</div>
				<img src="/images/certificat.png" alt="certificat" className='img-certificat'/>
		</div>
	);
};
export default WinnerPage;