import React from 'react';
import { room } from '../../../types/pacmanTypes';

interface ActiveRoomsListProps {
	rooms: room[];
	onJoinSpectator: (roomId: number) => void;
}

const ActiveRoomsList: React.FC<ActiveRoomsListProps> = ({ rooms, onJoinSpectator }) => {
	if (rooms.length === 0) {
		return <p className="no-room">Aucune partie en cours</p>;
	}

	return (
		<div className="rooms-list">
			{rooms.map(room => (
				<div key={room.id} className="room-item">
					<span className="room-name">{room.name}</span>
					<span className="room-count">
						{room.numberOfPlayers} / 5
					</span>
					<button
						className="join-btn"
						onClick={() => onJoinSpectator(room.id)}
					>
						Spectateur
					</button>
				</div>
			))}
		</div>
	);
};

export default ActiveRoomsList;
