// src/components/pacman/ActiveRooms.tsx
import React from 'react';
import { state } from '../../types/pacmanTypes';
import PacmanGame from './PacmanGame';
import '../../assets/styles/pacman/ActiveRooms.scss';


interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {
	const { game } = state;
	const { grid } = game;

	// Si la grille n'est pas encore chargée
	if (!grid || grid.length === 0) {
		return (
			<div className="active-rooms-container">
				<p>Aucune partie en cours.</p>
			</div>
		);
	}

	return (
		<div className="active-rooms-container">
			<PacmanGame state={state} />
		</div>
	);
};

export default ActiveRooms;
