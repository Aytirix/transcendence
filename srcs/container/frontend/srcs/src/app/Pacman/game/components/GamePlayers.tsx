import React from 'react';
import { player } from '../../../types/pacmanTypes';
import { GhostImages, PacmanImages, GamePlayer, DirectionalImages } from '../types/gameTypes';
import { useAuth } from '../../../../contexts/AuthContext';

interface GamePlayersProps {
	players: player[];
	tileSize: number;
	ghostImages: GhostImages;
	pacmanImages: PacmanImages;
	frightenedState: {
		active: boolean;
		remainingTime?: number;
	};
}

const GamePlayers: React.FC<GamePlayersProps> = ({ 
	players, 
	tileSize, 
	ghostImages, 
	pacmanImages, 
	frightenedState 
}) => {
	const { user } = useAuth(); // Obtenir l'utilisateur connecté
	
	// Fonction pour obtenir la couleur du point selon le personnage
	const getGhostDotColor = (ghostChar: string | undefined): string => {
		switch (ghostChar) {
			case 'B': // Blinky
				return '#ff0000';
			case 'I': // Inky
				return '#00ffff';
			case 'Y': // Pinky
				return '#ffb8ff';
			case 'C': // Clyde
				return '#ffb852';
			default:
				return '#ffffff';
		}
	};

	return (
		<>
			{players.map(player => {
				const gamePlayer = player as GamePlayer;
				
				// Pour Pacman
				if (gamePlayer.character === 'P') {
					const direction = (gamePlayer.direction || 'RIGHT').toLowerCase();
					const isDying = gamePlayer.isDying;

					// Sélection de l'image de Pacman
					let pacmanImage;
					if (isDying) {
						pacmanImage = pacmanImages.death;
					} else if (direction in pacmanImages) {
						pacmanImage = pacmanImages[direction as keyof PacmanImages];
					} else {
						pacmanImage = pacmanImages.default;
					}

					// Position et styles
					const half = tileSize / 2;
					const posX = gamePlayer.position?.x ?? 0;
					const posY = gamePlayer.position?.y ?? 0;

					return (
						<div key={gamePlayer.id} className="player-container" style={{
							position: 'absolute',
							top: posY - half,
							left: posX - half,
						}}>
							<div
								className="player pacman"
								style={{
									width: tileSize,
									height: tileSize,
									backgroundImage: `url(${pacmanImage})`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								}}
								title={`${gamePlayer.username} (${gamePlayer.score} pts)`}
							/>
							{/* Triangle au-dessus du personnage seulement pour l'utilisateur connecté */}
							{user && gamePlayer.id === user.id && (
								<div 
									className="player-triangle-indicator"
									style={{
										position: 'absolute',
										top: -20,
										left: half - 6,
										width: 0,
										height: 0,
										borderLeft: '6px solid transparent',
										borderRight: '6px solid transparent',
										borderTop: '12px solid #FFEE00',
										filter: 'drop-shadow(0 0 4px #FFEE00)',
										zIndex: 15
									}}
								/>
							)}
						</div>
					);
				}
				// Pour les fantômes
				else {
					const ghostChar = gamePlayer.character;
					const direction = (gamePlayer.direction || 'RIGHT').toLowerCase();
					const isFrightened = gamePlayer.isFrightened;

					const isBlinking = isFrightened && 
									   frightenedState?.active && 
									   frightenedState?.remainingTime !== undefined &&
									   (() => {
									   	   // Support pour millisecondes (>1000) et secondes (<=1000)
									   	   const time = frightenedState.remainingTime;
									   	   //const thresholdMs = time > 1000 ? 3000 : 3; // 3000ms ou 3s
									   	   return time <= 3000;
									   })();
					const isReturningToSpawn = gamePlayer.returnToSpawn === true;

					// Sélection du GIF approprié
					let ghostImage;

					if (isReturningToSpawn) {
						ghostImage = ghostImages.eyes[direction as keyof typeof ghostImages.eyes];
					} else if (isBlinking) {
						ghostImage = ghostImages.blinking;
					} else if (isFrightened) {
						ghostImage = ghostImages.frightened;
					} else {
						if (ghostChar && (ghostChar === 'B' || ghostChar === 'Y' || ghostChar === 'I' || ghostChar === 'C')) {
							const ghostImageSet = ghostImages[ghostChar];
							const validDirections: Array<keyof DirectionalImages> = ['right', 'left', 'up', 'down'];
							if (validDirections.includes(direction as keyof DirectionalImages)) {
								ghostImage = ghostImageSet[direction as keyof DirectionalImages];
							} else {
								ghostImage = ghostImages.B.right;
							}
						} else {
							ghostImage = ghostImages.B.right;
						}
					}

					const half = tileSize / 2;
					const posX = gamePlayer.position?.x ?? 0;
					const posY = gamePlayer.position?.y ?? 0;

					// Style spécifique pour les fantômes
					let ghostClass = "player ghost";
					if (isReturningToSpawn) ghostClass += " returning-to-spawn";
					if (isFrightened) ghostClass += " frightened";
					if (isBlinking) ghostClass += " blinking";

					return (
						<div key={gamePlayer.id} className="player-container" style={{
							position: 'absolute',
							top: posY - half,
							left: posX - half,
						}}>
							<div
								className={ghostClass}
								style={{
									width: tileSize - 3,
									height: tileSize - 3,
									backgroundImage: `url(${ghostImage})`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								}}
								title={`${gamePlayer.username} (${gamePlayer.score} pts)`}
							></div>
							{/* Triangle au-dessus du fantôme seulement pour l'utilisateur connecté */}
							{user && gamePlayer.id === user.id && (
								<div 
									className="player-triangle-indicator"
									style={{
										position: 'absolute',
										top: -20,
										left: half - 6,
										width: 0,
										height: 0,
										borderLeft: '6px solid transparent',
										borderRight: '6px solid transparent',
										borderTop: `12px solid ${getGhostDotColor(ghostChar)}`,
										filter: `drop-shadow(0 0 4px ${getGhostDotColor(ghostChar)})`,
										zIndex: 15
									}}
								/>
							)}
						</div>
					);
				}
			})}
		</>
	);
};

export default GamePlayers;
