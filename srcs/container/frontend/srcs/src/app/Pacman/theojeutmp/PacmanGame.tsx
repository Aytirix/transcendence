// src/components/pacman/PacmanGame.tsx
import React, { useState, useEffect } from 'react';
import './PacmanGame.scss';
import { state } from '../../types/pacmanTypes';
import portalImg from '../../assets/img/pacman/portal.gif';

// Import des GIFs de fantômes
import ghostBRightGif from '../../assets/img/pacman/ghosts/B-right.gif';
import ghostBLeftGif from '../../assets/img/pacman/ghosts/B-left.gif';
import ghostBUpGif from '../../assets/img/pacman/ghosts/B-up.gif';
import ghostBDownGif from '../../assets/img/pacman/ghosts/B-down.gif';

import ghostPRightGif from '../../assets/img/pacman/ghosts/P-right.gif';
import ghostPLeftGif from '../../assets/img/pacman/ghosts/P-left.gif';
import ghostPUpGif from '../../assets/img/pacman/ghosts/P-up.gif';
import ghostPDownGif from '../../assets/img/pacman/ghosts/P-down.gif';

import ghostIRightGif from '../../assets/img/pacman/ghosts/I-right.gif';
import ghostILeftGif from '../../assets/img/pacman/ghosts/I-left.gif';
import ghostIUpGif from '../../assets/img/pacman/ghosts/I-up.gif';
import ghostIDownGif from '../../assets/img/pacman/ghosts/I-down.gif';

import ghostCRightGif from '../../assets/img/pacman/ghosts/C-right.gif';
import ghostCLeftGif from '../../assets/img/pacman/ghosts/C-left.gif';
import ghostCUpGif from '../../assets/img/pacman/ghosts/C-up.gif';
import ghostCDownGif from '../../assets/img/pacman/ghosts/C-down.gif';

// Import des GIFs/PNGs spéciaux
import frightenedGif from '../../assets/img/pacman/ghosts/frightened.gif';
import blinkingGif from '../../assets/img/pacman/ghosts/blinking.gif';
import eyesRightPng from '../../assets/img/pacman/ghosts/eyes-right.png';
import eyesLeftPng from '../../assets/img/pacman/ghosts/eyes-left.png';
import eyesUpPng from '../../assets/img/pacman/ghosts/eyes-up.png';
import eyesDownPng from '../../assets/img/pacman/ghosts/eyes-down.png';

// Imports de Pacman
import pacmanRightGif from '../../assets/img/pacman/pacman-right.gif';
import pacmanLeftGif from '../../assets/img/pacman/pacman-left.gif';
import pacmanUpGif from '../../assets/img/pacman/pacman-up.gif';
import pacmanDownGif from '../../assets/img/pacman/pacman-down.gif';
import pacmanDeathGif from '../../assets/img/pacman/pacman-death.gif';
import pacmanPng from '../../assets/img/pacman/pacman.png';

// Créer un mapping d'images pour faciliter l'accès
const ghostImages = {
	'B': {
		'right': ghostBRightGif,
		'left': ghostBLeftGif,
		'up': ghostBUpGif,
		'down': ghostBDownGif
	},
	'Y': {
		'right': ghostPRightGif,
		'left': ghostPLeftGif,
		'up': ghostPUpGif,
		'down': ghostPDownGif
	},
	'I': {
		'right': ghostIRightGif,
		'left': ghostILeftGif,
		'up': ghostIUpGif,
		'down': ghostIDownGif
	},
	'C': {
		'right': ghostCRightGif,
		'left': ghostCLeftGif,
		'up': ghostCUpGif,
		'down': ghostCDownGif
	},
	'eyes': {
		'right': eyesRightPng,
		'left': eyesLeftPng,
		'up': eyesUpPng,
		'down': eyesDownPng
	},
	'frightened': frightenedGif,
	'blinking': blinkingGif
};

// Mapping pour les images de Pacman (similaire à ghostImages)
const pacmanImages = {
	'right': pacmanRightGif,
	'left': pacmanLeftGif,
	'up': pacmanUpGif,
	'down': pacmanDownGif,
	'death': pacmanDeathGif,
	'default': pacmanPng
};

const CONTAINER_SIZE_WIDTH = 775; // Doit correspondre à la taille CSS
const CONTAINER_SIZE_HEIGHT = 828 // Doit correspondre à la taille CSS

export interface Player {
	id: number;
	username: string;     // j'ai renommé en "username" pour coller à l'exemple d'Engine.ts
	character: string;    // 'P' pour Pac-Man, 'I','Y','B','P','C' pour fantômes, etc.
	position: {
		x: number;        // correspond désormais au centre en pixels
		y: number;
	};
	score: number;
	direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
	returnToSpawn?: boolean; // true si le joueur doit retourner à son spawn
	isFrightened?: boolean; // true si le fantôme est effrayé
	isDying?: boolean; // true si Pacman est en train de mourir
}

interface PacmanGameProps {
	state: state;
}

// Function to determine the type of wall tile based on its neighbors
const getWallType = (rowIndex: number, colIndex: number, grid: string[]): string => {
	// Check the 4 adjacent neighbors (top, right, bottom, left)
	const hasTopWall = rowIndex > 0 && grid[rowIndex - 1][colIndex] === '#';
	const hasRightWall = colIndex < grid[rowIndex].length - 1 && grid[rowIndex][colIndex + 1] === '#';
	const hasBottomWall = rowIndex < grid.length - 1 && grid[rowIndex + 1][colIndex] === '#';
	const hasLeftWall = colIndex > 0 && grid[rowIndex][colIndex - 1] === '#';

	// Count the number of wall neighbors
	const wallCount = [hasTopWall, hasRightWall, hasBottomWall, hasLeftWall].filter(Boolean).length;

	// Determine wall type
	if (wallCount === 1) {
		// End pieces
		if (hasTopWall) return 'wall-end-bottom';
		if (hasRightWall) return 'wall-end-left';
		if (hasBottomWall) return 'wall-end-top';
		if (hasLeftWall) return 'wall-end-right';
	} else if (wallCount === 2) {
		// Corner or straight
		if (hasTopWall && hasRightWall) return 'wall-corner-top-right';
		if (hasRightWall && hasBottomWall) return 'wall-corner-bottom-right';
		if (hasBottomWall && hasLeftWall) return 'wall-corner-bottom-left';
		if (hasLeftWall && hasTopWall) return 'wall-corner-top-left';
		if (hasTopWall && hasBottomWall) return 'wall-straight-vertical';
		if (hasLeftWall && hasRightWall) return 'wall-straight-horizontal';
	} else if (wallCount === 3) {
		// T-junctions
		if (!hasTopWall) return 'wall-t-top';
		if (!hasRightWall) return 'wall-t-right';
		if (!hasBottomWall) return 'wall-t-bottom';
		if (!hasLeftWall) return 'wall-t-left';
	} else if (wallCount === 4) {
		return 'wall-cross';
	}

	return 'wall-single'; // Isolated wall piece
};

const PauseMode = ({ state }: { state: state }) => {
	const { paused } = state.game.paused;

	return (
		<div className={`pause-mode ${paused ? 'active' : ''}`}>
			{paused && <div className="pause-message">{state.game.paused.message}</div>}
		</div>
	);
}

const PacmanGame: React.FC<PacmanGameProps> = ({ state }) => {
	const { grid, players, tileSize } = state.game;

	const numRows = grid.length;
	const numCols = grid[0].length;
	const mapWidth = numCols * tileSize;
	const mapHeight = numRows * tileSize;
	const scale = Math.min(
		CONTAINER_SIZE_WIDTH / mapWidth,
		CONTAINER_SIZE_HEIGHT / mapHeight
	);

	const offsetX = (CONTAINER_SIZE_WIDTH - mapWidth * scale) / 2;
	const offsetY = (CONTAINER_SIZE_HEIGHT - mapHeight * scale) / 2;

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;

		const keyActions: Record<string, string> = {
			'ArrowUp': 'UP',
			'ArrowDown': 'DOWN',
			'ArrowLeft': 'LEFT',
			'ArrowRight': 'RIGHT'
		};

		const direction = keyActions[event.key];
		if (direction) {
			state.ws.send(JSON.stringify({
				action: 'playerMove',
				direction: direction
			}));
			event.preventDefault();
		}
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [state.ws]);

	// Attribue une classe CSS à chaque caractère
	const getTileClass = (char: string, rowIndex: number, colIndex: number) => {
		switch (char) {
			case '#': return `tile wall ${getWallType(rowIndex, colIndex, grid)}`;
			case '.': return 'tile pellet';
			case '-': return 'tile door';
			case 'o': return 'tile power-pellet';
			case 'T': return 'tile tunnel';
			case ' ': return 'tile empty';
			default: return 'tile empty';
		}
	};


	return (
		<>
			<div className="header">
				<h3 className="title">PACMAN</h3>
				
			</div>
			<PauseMode state={state} />
			<div className="pacman-map-wrapper">
				<div className='column-left'></div>
				<div className="pacman-map-container" >
					{/* 1. Dessiner la grille : un <div> par case */}
					<div className='pacman-map'
						style={{
							position: 'absolute',
							top: offsetY,
							left: offsetX,
							width: `${mapWidth}px`,
							height: `${mapHeight}px`,
							transform: `scale(${scale})`,
							transformOrigin: 'top left'
						}}>
						{/* 1. Dessiner la grille : un <div> par case */}
						{/* 1. Dessiner les murs et les portes */}
						{grid.map((rowString, rowIndex) =>
							rowString.split('').map((char, colIndex) => {
								const tileClass = getTileClass(char, rowIndex, colIndex);
								const topPx = rowIndex * tileSize;
								const leftPx = colIndex * tileSize;
								return (
									<div
										key={`tile-${rowIndex}-${colIndex}`}
										className={tileClass}
										style={{
											top: topPx,
											left: leftPx,
											width: tileSize,
											height: tileSize,
										}}
									>
										{char === '-' && (
											<div
												className={`door ${(grid[rowIndex]?.[colIndex - 1] === '#' && grid[rowIndex]?.[colIndex + 1] === '#')
													? 'horizontal'
													: (grid[rowIndex - 1]?.[colIndex] === '#' && grid[rowIndex + 1]?.[colIndex] === '#')
														? 'vertical'
														: ''
													}`}
											/>
										)}
										{char === 'T' && <img src={portalImg} alt="portal" className="tunnel" />}
										{/* 2. Dessiner les éléments de la grille */}
										{char === '.' && <div className="dot" />}
										{char === 'o' && <div className="big-dot" />}
									</div>
								);
							})
						)}

						{/* 2. Superposer les joueurs */}
						{players.map(player => {
							// Pour Pacman
							if (player.character === 'P') {
								const direction = ((player as any).direction || 'RIGHT').toLowerCase();
								const isDying = (player as any).isDying; // À ajouter à votre interface Player si nécessaire

								// Sélection de l'image de Pacman
								let pacmanImage;
								if (isDying) {
									pacmanImage = pacmanImages.death;
								} else if (direction in pacmanImages) {
									pacmanImage = pacmanImages[direction as keyof typeof pacmanImages];
								} else {
									pacmanImage = pacmanImages.default;
								}

								// Position et styles
								const half = tileSize / 2;
								const posX = player.position?.x ?? 0;
								const posY = player.position?.y ?? 0;

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
										key={player.id}
										className="player pacman"
										style={baseStyle}
										title={`${player.username} (${player.score} pts)`}
									/>
								);
							}
							// Pour les fantômes
							else {
								// Déterminer quel GIF utiliser en fonction du caractère et de la direction
								const ghostChar = player.character; // 'B', 'P', 'I', 'C'
								console.log('ghostChar', ghostChar);
								const direction = ((player as any).direction || 'RIGHT').toLowerCase();
								const isFrightened = (player as any).isFrightened;
								const isBlinking = isFrightened && (player as any).frightenedRemainingTime < 8;
								const isReturningToSpawn = (player as any).returnToSpawn === true;

								// Sélection du GIF approprié
								// Solution plus simple mais moins sûre au niveau du typage
								let ghostImage;

								if (isReturningToSpawn) {
									ghostImage = ghostImages.eyes[direction as keyof typeof ghostImages.eyes];
								} else if (isBlinking) {
									ghostImage = ghostImages.blinking;
								} else if (isFrightened) {
									ghostImage = ghostImages.frightened;
								} else {
									// Utiliser as any pour contourner la vérification de type
									ghostImage = ghostChar && ghostChar in ghostImages
										? (ghostImages as any)[ghostChar][direction]
										: ghostImages.B.right;
								}

								const half = tileSize / 2;
								const posX = player.position?.x ?? 0;
								const posY = player.position?.y ?? 0;

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
										key={player.id}
										className={ghostClass}
										style={baseStyle}
										title={`${player.username} (${player.score} pts)`}
									></div>
								);
							}
						})}
					</div>
				</div>
				{/* 3. Afficher les scores */}
				<div className="column-right">
					{/* <h3 className="score">{players[0]?.username} : {players[0]?.score}</h3>
					<h3 className="score">{players[1]?.username} : {players[1]?.score}</h3> */}
					<div className="life">
						<span className="life-text">Lives : </span>
						{Array.from({ length: state.game?.pacmanLife || 0 }).map((_, index) => (
							<span key={index} className="heart">❤️</span>
						))}
					</div>
					{players.slice(0).map((player, index) => (
						<h3 
							key={index} 
							className="score" 
							style={{
								color: player.character === 'P' ? 'yellow' : 'inherit',
								order: player.character === 'P' ? -1 : index
							}}
						>
							{player.username} : {player.score}
						</h3>
					))}
				</div>
			</div>
		</>
	);
};

export default PacmanGame;
