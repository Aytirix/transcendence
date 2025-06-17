import React from 'react';
import { state } from '../../types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import ActiveRoomsList from './components/ActiveRoomsList';

interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {
	const handleSpectatorRoom = (roomId: number) => {
		state.ws?.send(JSON.stringify({ action: 'joinSpectator', room_id: roomId }));
	};

	return (
		<div className="waiting-rooms">
			<h2 className="rooms-title">Parties en cours</h2>
			<ActiveRoomsList
				rooms={state.rooms.active}
				onJoinSpectator={handleSpectatorRoom}
			/>
		</div>
	);
};

export default ActiveRooms;
