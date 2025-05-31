import React, { useEffect } from 'react';
import { state } from '@types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import { use } from 'i18next';

interface WaitingRoomsProps {
	state: state;
}

const WaitingRooms: React.FC<WaitingRoomsProps> = ({ state }) => {
	const [roomName, setRoomName] = React.useState('');
	const MAX_ROOM_NAME_LENGTH = 15;

	const handleCreateRoom = () => {
		if (roomName.trim() && roomName.length <= MAX_ROOM_NAME_LENGTH) {
			state.ws?.send(JSON.stringify({ action: 'createRoom', name: roomName }));
		}
	};

	const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Limiter la saisie à 15 caractères maximum
		const value = e.target.value;
		if (value.length <= MAX_ROOM_NAME_LENGTH) {
			setRoomName(value);
		}
	};

	// Fonction pour gérer la touche Entrée
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleCreateRoom();
		}
	};

	const handleJoinRoom = (roomId: number) => {
		state.ws?.send(JSON.stringify({ action: 'joinRoom', room_id: roomId }));
	};

	const handleKick = (userId: number) => {
		state.ws?.send(JSON.stringify({ action: 'kickRoom', user_id: userId }));
	};

	const handleSetOwner = (userId: number) => {
		state.ws?.send(JSON.stringify({ action: 'setOwner', user_id: userId }));
	};

	const handleLeave = () => {
		state.ws?.send(JSON.stringify({ action: 'leaveRoom' }));
	};

	const handleLaunch = () => {
		state.ws?.send(JSON.stringify({ action: 'launchRoom' }));
	};

	// Vérifier si l'utilisateur est déjà dans une salle d'attente
	const currentRoom = state.rooms.waiting.find(r =>
		r.players?.some(p => p.id === state.player?.id)
	);
	useEffect(() => {
		if (currentRoom) {
			setRoomName('');
		}

	}, [currentRoom]);
	const isOwner = currentRoom?.owner_id === state.player?.id;

	return (
		<div className="waiting-rooms">
			{!currentRoom ? (
				// Liste des rooms à rejoindre
				<>
					<div className="create-room">
						<input
							type="text"
							placeholder="Nom de la salle (15 max)"
							value={roomName}
							onChange={handleRoomNameChange}
							onKeyDown={handleKeyDown}
							maxLength={MAX_ROOM_NAME_LENGTH}
						/>
						<button onClick={handleCreateRoom}>Créer une salle</button>
					</div>
					{state.rooms.waiting.length === 0 ? (
						<p className="no-room">Aucune salle d'attente disponible.</p>
					) : (
						<div className="rooms-list">
							{state.rooms.waiting.map(r => (
								<div key={r.id} className="room-item">
									<span className="room-name">{r.name}</span>
									<span className="room-count">
										{r.numberOfPlayers} / 5
									</span>
									<button
										className="join-btn"
										onClick={() => handleJoinRoom(r.id)}
									>
										Rejoindre
									</button>
								</div>
							))}
						</div>
					)}
				</>
			) : (
				// Affichage de la salle actuelle
				<div className="current-room">
					<h2 className="room-title">{currentRoom.name}</h2>

					<div className="players-list">
						{Array.from({ length: 5 }).map((_, idx) => {
							const player = currentRoom.players?.[idx];
							const isRoomOwner = player && player.id === currentRoom.owner_id;

							return (
								<div key={idx} className="player-card">
									{player ? (
										<>
											<span className="player-name">
												{isRoomOwner && <span className="owner-star">★ </span>}
												{player.username}
											</span>
											<span className="player-elo">
												{player.elo} ELO
											</span>
											{isOwner && player.id !== currentRoom.owner_id && (
												<div className="player-actions">
													<button
														className="kick-btn"
														onClick={() => handleKick(player.id)}
														title="Exclure"
													>
														×
													</button>
													<button
														className="promote-btn"
														onClick={() => handleSetOwner(player.id)}
														title="Promouvoir comme propriétaire"
													>
														↑
													</button>
												</div>
											)}
										</>
									) : (
										<span className="waiting-slot">En attente d'un joueur</span>
									)}
								</div>
							);
						})}
					</div>

					<div className="room-actions">
						<button
							className="leave-btn"
							onClick={() => handleLeave()}
						>
							Quitter la salle
						</button>
						{isOwner && (
							<button
								className="launch-btn"
								onClick={() => handleLaunch()}
							>
								Lancer la partie
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default WaitingRooms;
