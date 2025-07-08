// src/components/pacman/ActiveRooms.tsx
import React from 'react';
import { state } from '../../types/pacmanTypes';
import PacmanGame from './PacmanGame';
import { useLanguage } from '../../../contexts/LanguageContext';
import '../../assets/styles/pacman/ActiveRooms.scss';


interface ActiveRoomsProps {
	state: state;
}

const ActiveRooms: React.FC<ActiveRoomsProps> = ({ state }) => {
	const { game } = state;
	const { grid } = game;
	const { t } = useLanguage();

	// Si la grille n'est pas encore chargée
	if (!grid || grid.length === 0) {
		return (
			<div className="active-rooms-container">
				<p>{t('pacman.game.noActiveGames')}</p>
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
