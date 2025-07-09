import React from 'react';
import portalImg from '../../../assets/img/pacman/portal.gif';

interface GameGridProps {
	grid: string[];
	tileSize: number;
	getWallType: (rowIndex: number, colIndex: number, grid: string[]) => string;
}

const GameGrid: React.FC<GameGridProps> = ({ grid, tileSize, getWallType }) => {
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
									className={`door ${(() => {
										const left = grid[rowIndex]?.[colIndex - 1];
										const right = grid[rowIndex]?.[colIndex + 1];
										const top = grid[rowIndex - 1]?.[colIndex];
										const bottom = grid[rowIndex + 1]?.[colIndex];
										
										// Fonction pour vérifier si c'est un obstacle (mur ou porte)
										const isObstacle = (cell: string) => cell === '#' || cell === '-';
										
										// Vérifier les orientations principales
										const isHorizontal = isObstacle(left) && isObstacle(right);
										const isVertical = isObstacle(top) && isObstacle(bottom);
										
										if (isHorizontal) return 'horizontal';
										if (isVertical) return 'vertical';
										
										// Cas des formes en L - déterminer l'orientation spécifique
										const hasTopLeft = isObstacle(top) && isObstacle(left);
										const hasTopRight = isObstacle(top) && isObstacle(right);
										const hasBottomLeft = isObstacle(bottom) && isObstacle(left);
										const hasBottomRight = isObstacle(bottom) && isObstacle(right);
										
										if (hasTopLeft) return 'l-shape-top-left';
										if (hasTopRight) return 'l-shape-top-right';
										if (hasBottomLeft) return 'l-shape-bottom-left';
										if (hasBottomRight) return 'l-shape-bottom-right';
										
										return '';
									})()}`}
								/>
							)}
							{char === 'T' && <img src={portalImg} alt="portal" className="tunnel" />}
							{char === '.' && <div className="dot" />}
							{char === 'o' && <div className="big-dot" />}
						</div>
					);
				})
			)}
		</>
	);
};

export default GameGrid;
