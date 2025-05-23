// src/components/pacman/PacmanMap.tsx
import React, { useState, useEffect } from 'react';
import './PacmanMap.scss';
import { state } from '../../types/pacmanTypes';
import portalImg from '../../assets/img/pacman/portal.gif';	

const CONTAINER_SIZE_WIDTH = 824 -50 ; // Doit correspondre à la taille CSS
const CONTAINER_SIZE_HEIGHT = 880 - 50; // Doit correspondre à la taille CSS

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
	isFrightened ?: boolean; // true si le fantôme est effrayé
}

interface PacmanMapProps {
	state: state;
}

// Function to determine the type of wall tile based on its neighbors
const getWallType = (rowIndex: number, colIndex: number, grid: string[]): string => {
  // Check the 4 adjacent neighbors (top, right, bottom, left)
  const hasTopWall = rowIndex > 0 && grid[rowIndex-1][colIndex] === '#';
  const hasRightWall = colIndex < grid[rowIndex].length-1 && grid[rowIndex][colIndex+1] === '#';
  const hasBottomWall = rowIndex < grid.length-1 && grid[rowIndex+1][colIndex] === '#';
  const hasLeftWall = colIndex > 0 && grid[rowIndex][colIndex-1] === '#';
  
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

const PacmanMap: React.FC<PacmanMapProps> = ({ state }) => {
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

	const ghostColors: Record<string, string> = {
		B: "#ff0000", // rouge
		Y: "#ff1493", // rose
		I: "#0000ff", // bleu
		C: "#ffa500"  // orange
	  };
	  

	return (
		<>
			<div className="header">
				<h3 className="title">test</h3>
			</div>
			<div className="pacman-map-wrapper">
				<div className='column-left'>
					{/* <div className="pacman-map-header">
						<h3 className="title">Pacman</h3>
						<h3 className="title">Score</h3>
						<h3 className="title">Vies</h3>
						</div> */}
				</div>
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
											className={`door ${
												(grid[rowIndex]?.[colIndex - 1] === '#' && grid[rowIndex]?.[colIndex + 1] === '#')
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
							
							const className =
							player.character === 'P'
							? 'player pacman'
							: `player ghost ghost-${player.character}`;
							
							// On soustrait tileSize/2 pour que (position.x, position.y) soit le centre du <div>
							const half = tileSize / 2;
							
							// Default position if undefined
							const posX = player.position?.x ?? 0;
							const posY = player.position?.y ?? 0;
							
							const baseStyle = {
								top: posY - half,
								left: posX - half,
								width: tileSize,
								height: tileSize,
								'--ghost-color': ghostColors[player.character] || 'white'
							} as React.CSSProperties;
							
							// Style spécifique pour Pac-Man (rotation)
							
							return (
								<div
								key={player.id}
								className={className}
								style={{...baseStyle}}
								title={`${player.username} (${player.score} pts)`}
								>
									{player.character !== 'P' && (
										<>
										<div className="ghost-body">
										<svg viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet">
											<polygon points="0 24, 4 24, 4 12, 8 12, 8 8, 12 8, 12 4, 20 4, 20 0, 36 0, 36 4, 44 4, 44 8, 48 8, 48 12, 52 12, 52 24, 56 24, 56 48, 0 48" />
										</svg>

										</div>
										<div className="ghost-eye-left">
											<svg preserveAspectRatio="xMidYMid meet">
												<polygon points="4 0, 12 0, 12 4, 16 4, 16 16, 12 16, 12 20, 4 20, 4 16, 0 16, 0 4, 4 4" />
											</svg>
										</div>
										<div className="ghost-eye-right">
											<svg preserveAspectRatio="xMidYMid meet">
												<polygon points="4 0, 12 0, 12 4, 16 4, 16 16, 12 16, 12 20, 4 20, 4 16, 0 16, 0 4, 4 4" />
											</svg>
										</div>

										
										<div className="pupil-left"></div>
										<div className="pupil-right"></div>
										</>
									)}
									{player.character === 'P' && (
										<>
											<div className="pacman-body"></div>
											{/* <div className="pacman-mouth"></div> */}
											<div className="pacman-eye"></div>
										</>
									)}	
								</div>
							);
						})}
					</div>
				</div>
				{/* 3. Afficher les scores */}
				<div className="column-right">
					{/* <h3 className="score">{players[0]?.username} : {players[0]?.score}</h3>
					<h3 className="score">{players[1]?.username} : {players[1]?.score}</h3> */}
					{players.slice(0).map((player, index) => (
						<h3 key={index} className="score">
							{player.username} : {player.score}
						</h3>
					))}
				</div>
		</div>
				</>
	);
};

export default PacmanMap;
