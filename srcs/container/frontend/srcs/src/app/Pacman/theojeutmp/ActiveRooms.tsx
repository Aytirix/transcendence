// src/components/pacman/ActiveRooms.tsx
import React from 'react';
import { state } from '../../types/pacmanTypes';
import PacmanMap from './PacmanMap';
import './ActiveRooms.scss';

interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {
	const { game } = state;
	const { grid, paused } = game;

	// Si la grille n'est pas encore chargée
	if (!grid || grid.length === 0) {
		return <p>Aucune partie en cours.</p>;
	}

	return (
		<div className="active-rooms-container">
			{paused.paused && (
				<div className="overlay-paused">
					<p className="paused-text">{paused.message || 'En pause'}</p>
				</div>
			)}
			<PacmanMap state={state} />
		</div>
	);
};

export default ActiveRooms;
