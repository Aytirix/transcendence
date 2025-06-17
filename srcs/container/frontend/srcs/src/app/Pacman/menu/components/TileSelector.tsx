import React from 'react';

interface TileSelectorProps {
	selectedTile: string;
	onTileSelect: (tile: string) => void;
}

const TileSelector: React.FC<TileSelectorProps> = ({ selectedTile, onTileSelect }) => {
	const tiles = [
		{ value: '#', name: 'Mur', className: 'tile wall' },
		{ value: ' ', name: 'Vide', className: 'tile empty' },
		{ value: '.', name: 'Pastille', className: 'tile pellet', content: <div className="dot"></div> },
		{ value: 'o', name: 'Super pastille', className: 'tile power-pellet', content: <div className="big-dot"></div> },
		{ value: '-', name: 'Porte', className: 'tile door', content: <div className="door-line"></div> },
		{ value: 'T', name: 'Tunnel', className: 'tile tunnel', content: 'T' },
		{ value: 'P', name: 'Spawn Pacman', className: 'tile spawn spawn-pacman', content: 'P' },
		{ value: 'B', name: 'Spawn Blinky', className: 'tile spawn spawn-blinky', content: 'B' },
		{ value: 'I', name: 'Spawn Inky', className: 'tile spawn spawn-inky', content: 'I' },
		{ value: 'Y', name: 'Spawn Pinky', className: 'tile spawn spawn-pinky', content: 'Y' },
		{ value: 'C', name: 'Spawn Clyde', className: 'tile spawn spawn-clyde', content: 'C' },
	];

	return (
		<div className="left-panel">
			<h3>Tiles</h3>
			<div className="tile-selector">
				{tiles.map((tile) => (
					<div
						key={tile.value}
						className={`tile-option ${selectedTile === tile.value ? 'selected' : ''}`}
						onClick={() => onTileSelect(tile.value)}
					>
						<div className={tile.className}>
							{tile.content}
						</div>
						<span>{tile.name}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default TileSelector;
