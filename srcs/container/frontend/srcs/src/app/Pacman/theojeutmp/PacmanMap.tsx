// src/components/pacman/PacmanMap.tsx
import React from 'react';
import './PacmanMap.scss';
import { state } from '../../types/pacmanTypes';

export interface Player {
	id: number;
	username: string;     // j'ai renommé en "username" pour coller à l'exemple d'Engine.ts
	character: string;    // 'P' pour Pac-Man, 'I','Y','B','P','C' pour fantômes, etc.
	position: {
		x: number;        // correspond désormais au centre en pixels
		y: number;
	};
	score: number;
}

interface PacmanMapProps {
	state: state;
}

const PacmanMap: React.FC<PacmanMapProps> = ({ state }) => {
	const { grid, players, tileSize } = state.game;

	const numRows = grid.length;
	const numCols = grid[0].length;
	const mapWidth = numCols * tileSize;
	const mapHeight = numRows * tileSize;

	// Attribue une classe CSS à chaque caractère
	const getTileClass = (char: string) => {
		switch (char) {
			case '#': return 'tile wall';
			case '.': return 'tile pellet';
			case 'o': return 'tile power-pellet';
			case 'T': return 'tile tunnel';
			case ' ': return 'tile empty';
			default: return 'tile empty';
		}
	};

	return (
		<div
			className="pacman-map-container"
			style={{ width: mapWidth, height: mapHeight }}
		>
			{/* 1. Dessiner la grille : un <div> par case */}
			{grid.map((rowString, rowIndex) =>
				rowString.split('').map((char, colIndex) => {
					const tileClass = getTileClass(char);
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

				return (
					<div
						key={player.id}
						className={className}
						style={{
							top: posY - half,
							left: posX - half,
							width: tileSize,
							height: tileSize,
						}}
						title={`${player.username} (${player.score} pts)`}
					>
						{player.character !== 'P' && (
							<>
								<div className="pupil-left"></div>
								<div className="pupil-right"></div>
							</>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PacmanMap;
