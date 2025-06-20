import React from 'react';

interface GameContainerProps {
	children: React.ReactNode;
	grid: string[];
	tileSize: number;
	scale: number;
	offsetX: number;
	offsetY: number;
}

const GameContainer: React.FC<GameContainerProps> = ({ 
	children, 
	grid, 
	tileSize, 
	scale, 
	offsetX, 
	offsetY 
}) => {
	const mapWidth = (grid[0]?.length || 0) * tileSize;
	const mapHeight = grid.length * tileSize;

	return (
		<div className="pacman-map-container">
			<div className='pacman-map'
				style={{
					position: 'absolute',
					top: offsetY,
					left: offsetX,
					width: `${mapWidth}px`,
					height: `${mapHeight}px`,
					transform: `scale(${scale})`,
					transformOrigin: 'top left'
				}}
			>
				{children}
			</div>
		</div>
	);
};

export default GameContainer;
