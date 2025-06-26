import React, { useEffect, useState } from 'react';
import { state } from '../../types/pacmanTypes';
import '../../assets/styles/pacman/WaitingRooms.scss';
import { useMapOptions } from './hooks';
import { CreateRoomForm, RoomsList, CurrentRoom } from './components';

interface WaitingRoomsProps {
	state: state;
}

const WaitingRooms: React.FC<WaitingRoomsProps> = ({ state }) => {
	const [roomName, setRoomName] = useState('');
	const [mapSearch, setMapSearch] = useState('');
	const selectedMap = 'classic';
	const MAX_ROOM_NAME_LENGTH = 15;

	// Use the useMapOptions hook to get map data
	const { MAPS, userMaps, loading, error } = useMapOptions(state);

	// Add filtered maps logic
	const filteredMaps = MAPS.filter(map =>
		!map.disabled && map.label.toLowerCase().includes(mapSearch.toLowerCase())
	);

	// Fonction pour créer une salle
	const handleCreateRoom = () => {
		if (roomName.trim() && roomName.length <= MAX_ROOM_NAME_LENGTH) {
			// Send map id if custom, else map name
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

	// Fonction pour changer la carte de la salle
	const handleChangeRoomMap = (mapValue: string) => {
		const isCustom = userMaps.some(m => m.value === mapValue);
		if (mapValue == '' || !mapValue) {
			return;
		}
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
					<CreateRoomForm
						roomName={roomName}
						onRoomNameChange={handleRoomNameChange}
						onKeyDown={handleKeyDown}
						onCreateRoom={handleCreateRoom}
						maxLength={MAX_ROOM_NAME_LENGTH}
					/>
					<RoomsList
						rooms={state.rooms.waiting}
						onJoinRoom={handleJoinRoom}
					/>
				</>
			) : (
				// Affichage de la salle actuelle
				<CurrentRoom
					currentRoom={currentRoom}
					isOwner={!!isOwner}
					mapSearch={mapSearch}
					onMapSearchChange={(e) => setMapSearch(e.target.value)}
					onChangeRoomMap={handleChangeRoomMap}
					filteredMaps={filteredMaps}
					allMaps={MAPS}
					onKick={handleKick}
					onSetOwner={handleSetOwner}
					onLeave={handleLeave}
					onLaunch={handleLaunch}
					selectedMap={selectedMap}
				/>
			)}
		</div>
	);
};

export default WaitingRooms;
