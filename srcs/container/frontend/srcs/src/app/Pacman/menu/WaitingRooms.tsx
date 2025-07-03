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
	const [selectedMap, setSelectedMap] = useState('classic');
	const MAX_ROOM_NAME_LENGTH = 15;

	// Use the useMapOptions hook to get map data
	const { MAPS, loading, error } = useMapOptions(state);

	// Add filtered maps logic
	const filteredMaps = MAPS.filter(map =>
		!map.disabled && map.label.toLowerCase().includes(mapSearch.toLowerCase())
	);

	// Fonction pour créer une salle
	const handleCreateRoom = () => {
		if (roomName.trim() && roomName.length <= MAX_ROOM_NAME_LENGTH) {
			// Send map id if custom or public, else map name
			const existingMap = MAPS.find(m => m.value === selectedMap);
			const mapPayload = existingMap
				? { map_id: Number(selectedMap), user_id: existingMap.userId || 0 }
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
		if (mapValue == '' || !mapValue) {
			return;
		}
		// Vérifier si c'est une carte personnalisée ou publique (qui nécessite un map_id)
	//const isCustomOrPublic = userMaps.some(m => m.value === mapValue) || publicMaps.some(m => m.value === mapValue);
		const existingMap = MAPS.find(m => m.value === mapValue);
		if (!existingMap) {
			console.error('Map not found:', mapValue);
			return;
		}
		const payload = { map_id: Number(existingMap.mapId), user_id: existingMap.userId || 0 };

		state.ws?.send(JSON.stringify({ action: 'setRoomMap', ...payload }));
		setSelectedMap(mapValue);
	};

	// Vérifier si l'utilisateur est déjà dans une salle d'attente
	const currentRoom = state.rooms.waiting.find(r =>
		r.players?.some(p => p.id === state.player?.id)
	);

	useEffect(() => {
		if (currentRoom) {
			setRoomName(currentRoom.name || '');
		}
	}, [currentRoom]);

	// Gérer automatiquement la requête searchMap quand l'utilisateur rejoint une room
	useEffect(() => {
		if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
			return;
		}

		// Vérifier si l'utilisateur est dans une CurrentRoom
		const currentRoom = state.rooms?.waiting?.find(r =>
			r.players?.some(p => p.id === state.player?.id)
		);

		// Si l'utilisateur est dans une room, envoyer searchMap et configurer un rafraîchissement
		if (currentRoom) {
			console.log('Utilisateur dans une room, envoi de searchMap');
			
			// Envoyer immédiatement
			state.ws.send(JSON.stringify({ action: 'searchMap', text: mapSearch }));

			// Configurer un rafraîchissement toutes les 5 secondes pour les mises à jour temps réel
			const interval = setInterval(() => {
				if (state.ws && state.ws.readyState === WebSocket.OPEN) {
					state.ws.send(JSON.stringify({ action: 'searchMap', text: mapSearch }));
				}
			}, 5000);

			return () => {
				clearInterval(interval);
			};
		}
	}, [state.ws, state.rooms?.waiting, state.player?.id, mapSearch]);

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
