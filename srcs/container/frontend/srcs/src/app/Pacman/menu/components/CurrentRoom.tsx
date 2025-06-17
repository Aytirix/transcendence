import React from 'react';
import { room } from '../../../types/pacmanTypes';
import { MapOption } from './MapSelector';
import MapSelector from './MapSelector';
import PlayersList from './PlayersList';

interface CurrentRoomProps {
	currentRoom: room;
	isOwner: boolean;
	mapSearch: string;
	onMapSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onChangeRoomMap: (mapValue: string) => void;
	filteredMaps: MapOption[];
	allMaps: MapOption[];
	onKick: (userId: number) => void;
	onSetOwner: (userId: number) => void;
	onLeave: () => void;
	onLaunch: () => void;
	selectedMap: string;
}

const CurrentRoom: React.FC<CurrentRoomProps> = ({
	currentRoom,
	isOwner,
	mapSearch,
	onMapSearchChange,
	onChangeRoomMap,
	filteredMaps,
	allMaps,
	onKick,
	onSetOwner,
	onLeave,
	onLaunch,
	selectedMap
}) => {
	const currentMapValue = currentRoom.map_id
		? String(currentRoom.map_id)
		: currentRoom.map || selectedMap;

	return (
		<div className="current-room">
			<h2 className="room-title">{currentRoom.name}</h2>
			
			<div className="room-map">
				<MapSelector
					isOwner={isOwner}
					currentMapValue={currentMapValue}
					mapSearch={mapSearch}
					onMapSearchChange={onMapSearchChange}
					onMapChange={onChangeRoomMap}
					filteredMaps={filteredMaps}
					allMaps={allMaps}
				/>
			</div>

			<PlayersList
				currentRoom={currentRoom}
				isOwner={isOwner}
				onKick={onKick}
				onSetOwner={onSetOwner}
			/>

			<div className="room-actions">
				<button
					className="leave-btn"
					onClick={onLeave}
				>
					Quitter la salle
				</button>
				{isOwner && (
					<button
						className="launch-btn"
						onClick={onLaunch}
					>
						Lancer la partie
					</button>
				)}
			</div>
		</div>
	);
};

export default CurrentRoom;
