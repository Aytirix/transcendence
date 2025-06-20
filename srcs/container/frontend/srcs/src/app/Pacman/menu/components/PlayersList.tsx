import React from 'react';
import { room } from '../../../types/pacmanTypes';
import PlayerCard from './PlayerCard';

interface PlayersListProps {
	currentRoom: room;
	isOwner: boolean;
	onKick: (userId: number) => void;
	onSetOwner: (userId: number) => void;
}

const PlayersList: React.FC<PlayersListProps> = ({
	currentRoom,
	isOwner,
	onKick,
	onSetOwner
}) => {
	return (
		<div className="players-list">
			{Array.from({ length: 5 }).map((_, idx) => {
				const player = currentRoom.players?.[idx];
				const isRoomOwner = player && player.id === currentRoom.owner_id;

				return (
					<PlayerCard
						key={idx}
						player={player}
						isRoomOwner={!!isRoomOwner}
						isCurrentUserOwner={isOwner}
						onKick={onKick}
						onSetOwner={onSetOwner}
					/>
				);
			})}
		</div>
	);
};

export default PlayersList;
