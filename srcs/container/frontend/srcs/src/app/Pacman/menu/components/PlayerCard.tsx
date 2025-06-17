import React from 'react';
import { player } from '../../../types/pacmanTypes';

interface PlayerCardProps {
	player?: player;
	isRoomOwner: boolean;
	isCurrentUserOwner: boolean;
	onKick: (userId: number) => void;
	onSetOwner: (userId: number) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
	player,
	isRoomOwner,
	isCurrentUserOwner,
	onKick,
	onSetOwner
}) => {
	if (!player) {
		return (
			<div className="player-card">
				<span className="waiting-slot">En attente d'un joueur</span>
			</div>
		);
	}

	return (
		<div className="player-card">
			<span className="player-name">
				{isRoomOwner && <span className="owner-star">★ </span>}
				{player.username}
			</span>
			<span className="player-elo">
				{player.elo} ELO
			</span>
			{isCurrentUserOwner && !isRoomOwner && (
				<div className="player-actions">
					<button
						className="kick-btn"
						onClick={() => onKick(player.id)}
						title="Exclure"
					>
						×
					</button>
					<button
						className="promote-btn"
						onClick={() => onSetOwner(player.id)}
						title="Promouvoir comme propriétaire"
					>
						↑
					</button>
				</div>
			)}
		</div>
	);
};

export default PlayerCard;
