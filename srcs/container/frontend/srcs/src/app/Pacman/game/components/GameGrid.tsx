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
									className={`door ${(grid[rowIndex]?.[colIndex - 1] === '#' && grid[rowIndex]?.[colIndex + 1] === '#')
										? 'horizontal'
										: (grid[rowIndex - 1]?.[colIndex] === '#' && grid[rowIndex + 1]?.[colIndex] === '#')
											? 'vertical'
											: ''
										}`}
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
