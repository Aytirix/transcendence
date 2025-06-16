import React, { useEffect } from 'react';
import { state } from '@types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import { use } from 'i18next';
import { useState } from 'react';

interface WaitingRoomsProps {
	state: state;
}

// Hook pour récupérer toutes les maps publiques via WebSocket
export function useFetchPublicMaps(state: state) {
	const [publicMaps, setPublicMaps] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<null | string>(null);

	useEffect(() => {
		if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
			setLoading(false);
			return;
		}

		// Send the search request
		state.ws.send(JSON.stringify({ action: 'searchMap', query: '' }));

		// Check if we get results from state.publicMaps (handled in Init.tsx)
		const checkForMaps = () => {
			if (state.publicMaps && state.publicMaps.length >= 0) {
				setPublicMaps(state.publicMaps);
				setLoading(false);
			}
		};

		// Check immediately and set up an interval to check for updates
		checkForMaps();
		const interval = setInterval(checkForMaps, 100);

		// Clean up after 5 seconds
		const timeout = setTimeout(() => {
			clearInterval(interval);
			if (loading) {
				setLoading(false);
			}
		}, 5000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [state.ws, state.publicMaps, loading]);

	return { publicMaps, loading, error };
}

// Hook pour récupérer toutes les maps (user + publiques)
export function useAllMaps(state: state) {
	const { publicMaps, loading: loadingPublic, error: errorPublic } = useFetchPublicMaps(state);
	const userMaps = state.maps || [];
	const allMaps = [
		...userMaps,
		...publicMaps.filter(
			(pubMap: any) => !userMaps.some((userMap: any) => userMap.id === pubMap.id)
		),
	];
	return { allMaps, loading: loadingPublic, error: errorPublic };
}

const WaitingRooms: React.FC<WaitingRoomsProps> = ({ state }) => {
	const [roomName, setRoomName] = React.useState('');
	const [selectedMap, setSelectedMap] = React.useState('classic');
	const [mapSearch, setMapSearch] = React.useState('');
	const MAX_ROOM_NAME_LENGTH = 15;

	// Use the useAllMaps hook to get combined user and public maps
	const { allMaps, loading, error } = useAllMaps(state);

	// Default maps
	const DEFAULT_MAPS = [
		{ value: 'classic', label: 'Classique', isCustom: false, isValid: true },
	];

	// Separate user maps and public maps from allMaps
	const userMaps = allMaps
		.filter(map => map.user_id === state.player?.id)
		.map(map => ({
			value: map.id ? String(map.id) : map.name,
			label: map.name,
			isCustom: true,
			isValid: map.is_valid,
		}))
		.filter(map => map.isValid)
		.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

	const publicMaps = allMaps
		.filter(map => map.user_id !== state.player?.id && map.is_public && map.is_valid)
		.map(map => ({
			value: map.id ? String(map.id) : map.name,
			label: `${map.name} (${map.username || 'Public'})`,
			isCustom: false,
			isValid: true,
		}))
		.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

	// Combine all maps
	const MAPS = [
		...DEFAULT_MAPS,
		...(userMaps.length > 0 ? [{ value: '', label: '--- Mes cartes ---', disabled: true }] : []),
		...userMaps,
		...(publicMaps.length > 0 ? [{ value: '', label: '--- Cartes publiques ---', disabled: true }] : []),
		...publicMaps,
	];

	// Add filtered maps logic
	const filteredMaps = MAPS.filter(map => 
		!map.disabled && map.label.toLowerCase().includes(mapSearch.toLowerCase())
	);

	// Fonction pour créer une salle
	const handleCreateRoom = () => {
		if (roomName.trim() && roomName.length <= MAX_ROOM_NAME_LENGTH) {
			// Send map id if custom, else map name
			const selected = MAPS.find(m => m.value === selectedMap);
			const mapPayload = userMaps.some(m => m.value === selectedMap)
				? { map_id: Number(selectedMap) }
				: { map: selectedMap };
			state.ws?.send(JSON.stringify({ action: 'createRoom', name: roomName, map: selectedMap, ...mapPayload }));
		}
	};

	// Fonction pour changer le nom de la salle
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

	// Fonction pour rejoindre une salle
	const handleJoinRoom = (roomId: number) => {
		state.ws?.send(JSON.stringify({ action: 'joinRoom', room_id: roomId }));
	};

	// Fonction pour exclure un joueur
	const handleKick = (userId: number) => {
		state.ws?.send(JSON.stringify({ action: 'kickRoom', user_id: userId }));
	};

	// Fonction pour promouvoir un joueur comme propriétaire
	const handleSetOwner = (userId: number) => {
		state.ws?.send(JSON.stringify({ action: 'setOwner', user_id: userId }));
	};

	// Fonction pour quitter la salle
	const handleLeave = () => {
		state.ws?.send(JSON.stringify({ action: 'leaveRoom' }));
	};

	// Fonction pour lancer la partie
	const handleLaunch = () => {
		state.ws?.send(JSON.stringify({ action: 'launchRoom' }));
	};

	// Fonction pour changer la carte sélectionnée
	const handleMapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedMap(e.target.value);
	};

	// Fonction pour changer la carte de la salle
	const handleChangeRoomMap = (mapValue: string) => {
		const isCustom = userMaps.some(m => m.value === mapValue);
		const payload = isCustom ? { map_id: Number(mapValue) } : { map: mapValue };
		state.ws?.send(JSON.stringify({ action: 'setRoomMap', ...payload }));
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

	// Show loading state
	if (loading) {
		return <div className="waiting-rooms loading">Chargement des cartes...</div>;
	}

	// Show error state
	if (error) {
		console.error('Error loading maps:', error);
	}

	return (
		<div className="waiting-rooms">
			{!currentRoom ? (
				// Liste des rooms à rejoindre
				<>
					<div className="create-room">
						<input
							type="text"
							placeholder="Nom de la salle"
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
					<div className="room-map">
						{isOwner ? ( <>
							<input
								type="text"
								placeholder="Rechercher..."
								value={mapSearch}
								onChange={(e) => setMapSearch(e.target.value)}
								className="map-search"
							/>
							<select 
								className='map-select'
								value={
									currentRoom.map_id
									? String(currentRoom.map_id)
									: currentRoom.map || selectedMap
								}
								onChange={e => handleChangeRoomMap(e.target.value)}
							>
								{filteredMaps.map(map => (
									<option key={map.value} value={map.value}>
										{map.isCustom ? '🗺️ ' : ''}
										{map.isValid ? '' : '❌ '}
										{map.label}
									</option>
								))}
							</select>
							</>
						) : (
							<span>
								Carte :{' '}
								{
									MAPS.find(
										m =>
											m.value ===
												(currentRoom.map_id
													? String(currentRoom.map_id)
													: currentRoom.map || selectedMap)
									)?.label || 'Classique'
								}
							</span>
						)}
					</div>

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
