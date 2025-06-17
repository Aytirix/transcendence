// src/components/pacman/CreatePacmanMap.tsx
import React from 'react';
import '../../assets/styles/pacman/CreatePacmanMap.scss';
import { state, PacmanMap } from '../../types/pacmanTypes';
import Editor, { isSpawnPoint, getSpawnColor, getCellClass } from './CreateMap/Editor.tsx';
import { 
	TileSelector, 
	MapNameModal, 
	MapToolbar, 
	MapPreview, 
	MapConsole,
	MapNameInput
} from './components';
import { useMapEditor, useMapDrawing } from './hooks';

interface CreatePacmanMapProps {
	state: state;
	onSave?:  (mapData: PacmanMap, isAutoSave : boolean) => void;
	onCancel: () => void;
	initialMap?: string[];
	editingMap?: Partial<PacmanMap>;
}


const CreatePacmanMap: React.FC<CreatePacmanMapProps> = ({ state, onSave, onCancel, initialMap, editingMap }) => {
	const DEFAULT_TILE_SIZE = 15;

	// Utilisation des hooks modulaires
	const mapEditor = useMapEditor({ state, initialMap, editingMap, onSave });
	const mapDrawing = useMapDrawing({
		grid: mapEditor.grid,
		setGrid: mapEditor.setGrid,
		selectedTile: mapEditor.selectedTile,
		setGridModified: mapEditor.setGridModified,
		isDrawing: mapEditor.isDrawing,
		setIsDrawing: mapEditor.setIsDrawing,
		rows: mapEditor.rows,
		cols: mapEditor.cols
	});

	// Gestionnaires d'événements
	const handleNameChange = (name: string) => {
		mapEditor.setMapName(name);
		mapEditor.setNameModified(true);
	};

	const handleMapNameSubmit = (name: string) => {
		mapEditor.setMapName(name);
		mapEditor.setNameModified(true);
	};

	const saveMap = () => {
		if (!mapEditor.mapName) return;
		
		const trimmedName = mapEditor.mapName.trim();
		mapEditor.setMapName(trimmedName);
		mapEditor.setNameModified(false);
		
		const mapData = mapEditor.prepareMapData();
		onSave?.(mapData, false);
	};

	return (
		<div className="create-pacman-map">
			<h2>Créer une carte Pacman</h2>
			
			<MapNameModal
				isOpen={!mapEditor.mapName}
				tempMapName={mapEditor.tempMapName}
				setTempMapName={mapEditor.setTempMapName}
				existingMaps={state?.maps}
				onSubmit={handleMapNameSubmit}
			/>

			<MapNameInput
				mapName={mapEditor.mapName}
				onNameChange={handleNameChange}
				disabled={!mapEditor.mapName}
				blurred={!mapEditor.mapName}
			/>

			<div className="editor-container">
				<TileSelector
					selectedTile={mapEditor.selectedTile}
					onTileSelect={mapEditor.setSelectedTile}
				/>

				<div className="main-content">
					<MapToolbar
						onAddBorders={mapDrawing.addBorders}
						onSave={saveMap}
						onCancel={onCancel}
					/>

					<Editor
						grid={mapEditor.grid}
						DEFAULT_TILE_SIZE={DEFAULT_TILE_SIZE}
						isSpawnPoint={isSpawnPoint}
						getSpawnColor={getSpawnColor}
						getCellClass={getCellClass}
						handleCellClick={(rowIndex, colIndex) => {
							mapDrawing.handleCellClick(rowIndex, colIndex);
							mapEditor.setGridModified(true);
						}}
						handleCellEnter={mapDrawing.handleCellEnter}
					/>
				</div>

				<MapPreview grid={mapEditor.grid} />
			</div>

			<MapConsole maps={state?.maps} mapId={mapEditor.id} />
		</div>
	);
};


export default CreatePacmanMap;