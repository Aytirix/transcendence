import React from 'react';
import { state } from '../../types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import ActiveRoomsList from './components/ActiveRoomsList';
import { useLanguage } from '../../../contexts/LanguageContext';
interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {
	const { t } = useLanguage();

	const handleSpectatorRoom = (roomId: number) => {
		state.ws?.send(JSON.stringify({ action: 'joinSpectator', room_id: roomId }));
	};

	return (
		<div className="waiting-rooms">
			<h2 className="rooms-title">{t("pacman.menu.liveGames.title")}</h2>
			<ActiveRoomsList
				rooms={state.rooms.active}
				onJoinSpectator={handleSpectatorRoom}
			/>
		</div>
	);
};

export default ActiveRooms;
