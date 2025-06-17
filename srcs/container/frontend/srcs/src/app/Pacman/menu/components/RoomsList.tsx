import React from 'react';
import { room } from '../../../types/pacmanTypes';

interface RoomsListProps {
	rooms: room[];
	onJoinRoom: (roomId: number) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ rooms, onJoinRoom }) => {
	if (rooms.length === 0) {
		return <p className="no-room">Aucune salle d'attente disponible.</p>;
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
						onClick={() => onJoinRoom(room.id)}
					>
						Rejoindre
					</button>
				</div>
			))}
		</div>
	);
};

export default RoomsList;
