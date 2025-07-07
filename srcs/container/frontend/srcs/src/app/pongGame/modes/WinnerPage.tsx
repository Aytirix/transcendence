import React, { useState, useEffect, useRef } from 'react';
import '../pong.css';
import { useNavigate } from "react-router-dom";
import ApiService from '../../../api/ApiService';
import { useLanguage } from '../../../contexts/LanguageContext';



const WinnerPage: React.FC = () => {
	const socketRef = useRef<WebSocket | null>(null);
	const [dataPlayer, setDataplayer] = useState<{name: string, avatar: string}>();
	const { t } = useLanguage();
	const navigate = useNavigate();

	const returnMenu = () => {
		navigate("/pong");
	}
	useEffect(() => {
		const socket = new WebSocket(`wss://${window.location.host}/api/pong`);
		socketRef.current = socket;
	
		socket.onmessage = (message: MessageEvent) => {
			const data = JSON.parse(message.data);
			if (data.type === "data") {
				setDataplayer(data.value);
			}
		}
		return () => {
			socket.close();
		};
	}, [])
	return(
		<div className='WinnerPage'>
			<div className='popup-WinnerPage'>
				<h1 className="name-winner">Pong1</h1>
				<div className='avatar-Winner'>
					<img src={ApiService.getFile(dataPlayer?.avatar)} alt="Avatar" className="w-full h-full object-cover rounded-[20px]"/>
				</div>
				<img src="/images/logomarvel.png" alt="logo" className='img-logo'/>
				<img src={t("pong.tournament.certificat")} alt="certificat" className='img-certificat'/>
			</div>
			<div>
				<button onClick={returnMenu} className="Return-Menu">{t("pong.multi.returnmenu")}</button>
			</div>
		</div>
	);
};
export default WinnerPage;