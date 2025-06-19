import React from 'react';
import { room } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface RoomsListProps {
	rooms: room[];
	onJoinRoom: (roomId: number) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ rooms, onJoinRoom }) => {
	const { t } = useLanguage();
	
	if (rooms.length === 0) {
		return <p className="no-room">{t("pacman.menu.lobby.noGamesFound")}</p>;
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
						{t("pacman.menu.lobby.join")}
					</button>
				</div>
			))}
		</div>
	);
};

export default RoomsList;
