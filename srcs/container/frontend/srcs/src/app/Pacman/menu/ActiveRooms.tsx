import React, { useEffect } from 'react';
import { state } from '@types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import { use } from 'i18next';

interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {

	const handleSpectatorRoom = (roomId: number) => {
		state.ws?.send(JSON.stringify({ action: 'SpectatorRoom', room_id: roomId }));
	};

	return (
		<>
			<h2 className="rooms-title">Parties en cours</h2>
			<div className="waiting-rooms">
				<>
					{state.rooms.active.length === 0 ? (
						<p className="no-room">Aucune partie en cours</p>
					) : (
						<div className="rooms-list">
							{state.rooms.active.map(r => (
								<div key={r.id} className="room-item">
									<span className="room-name">{r.name}</span>
									<span className="room-count">
										{r.players?.length} / 5
									</span>
									<button
										className="join-btn"
										onClick={() => handleSpectatorRoom(r.id)}
									>
										Spectateur
									</button>
								</div>
							))}
						</div>
					)}
				</>
			</div>
		</>
	);
};

export default ActiveRooms;
