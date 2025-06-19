import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface TileSelectorProps {
	selectedTile: string;
	onTileSelect: (tile: string) => void;
}

const TileSelector: React.FC<TileSelectorProps> = ({ selectedTile, onTileSelect }) => {
	const { t } = useLanguage();
	const tiles = [
		{ value: '#', name: t("pacman.menu.maps.mapEditor.tiles.wall"), className: 'tile wall' },
		{ value: ' ', name: t("pacman.menu.maps.mapEditor.tiles.empty"), className: 'tile empty' },
		{ value: '.', name: t("pacman.menu.maps.mapEditor.tiles.pellet"), className: 'tile pellet', content: <div className="dot"></div> },
		{ value: 'o', name: t("pacman.menu.maps.mapEditor.tiles.superPellet"), className: 'tile power-pellet', content: <div className="big-dot"></div> },
		{ value: '-', name: t("pacman.menu.maps.mapEditor.tiles.door"), className: 'tile door', content: <div className="door-line"></div> },
		{ value: 'T', name: t("pacman.menu.maps.mapEditor.tiles.tunnel"), className: 'tile tunnel', content: 'T' },
		{ value: 'P', name: t("pacman.menu.maps.mapEditor.tiles.pacmanSpawn"), className: 'tile spawn spawn-pacman', content: 'P' },
		{ value: 'B', name: t("pacman.menu.maps.mapEditor.tiles.blinkySpawn"), className: 'tile spawn spawn-blinky', content: 'B' },
		{ value: 'I', name: t("pacman.menu.maps.mapEditor.tiles.inkySpawn"), className: 'tile spawn spawn-inky', content: 'I' },
		{ value: 'Y', name: t("pacman.menu.maps.mapEditor.tiles.pinkySpawn"), className: 'tile spawn spawn-pinky', content: 'Y' },
		{ value: 'C', name: t("pacman.menu.maps.mapEditor.tiles.clydeSpawn"), className: 'tile spawn spawn-clyde', content: 'C' },
	];
	

	return (
		<div className="left-panel">
			<h3>{t("pacman.menu.maps.mapEditor.tiles.title")}</h3>
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
