import React from 'react';
import { player } from '../../../types/pacmanTypes';
import { GhostImages, PacmanImages, GamePlayer, DirectionalImages } from '../types/gameTypes';

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

					const baseStyle = {
						top: posY - half,
						left: posX - half,
						width: tileSize,
						height: tileSize,
						backgroundImage: `url(${pacmanImage})`,
						backgroundSize: 'contain',
						backgroundRepeat: 'no-repeat',
						backgroundPosition: 'center',
					} as React.CSSProperties;

					return (
						<div
							key={gamePlayer.id}
							className="player pacman"
							style={baseStyle}
							title={`${gamePlayer.username} (${gamePlayer.score} pts)`}
						/>
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

					const baseStyle = {
						top: posY - half,
						left: posX - half,
						width: tileSize,
						height: tileSize,
						backgroundImage: `url(${ghostImage})`,
						backgroundSize: 'contain',
						backgroundRepeat: 'no-repeat',
						backgroundPosition: 'center',
					} as React.CSSProperties;

					// Style spécifique pour les fantômes
					let ghostClass = "player ghost";
					if (isReturningToSpawn) ghostClass += " returning-to-spawn";
					if (isFrightened) ghostClass += " frightened";
					if (isBlinking) ghostClass += " blinking";

					return (
						<div
							key={gamePlayer.id}
							className={ghostClass}
							style={baseStyle}
							title={`${gamePlayer.username} (${gamePlayer.score} pts)`}
						></div>
					);
				}
			})}
		</>
	);
};

export default GamePlayers;
