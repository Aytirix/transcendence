// src/components/pacman/CreatePacmanMap.tsx
import React, { useState, useEffect } from 'react';
import '../../assets/styles/pacman/CreatePacmanMap.scss';
import { state, PacmanMap } from '../../types/pacmanTypes';
import { set } from 'date-fns';

// Importez le nouveau composant Editor
import Editor, { isSpawnPoint, getSpawnColor, getCellClass } from './CreateMap/Editor.tsx';

interface CreatePacmanMapProps {
	state: state;
	onSave?:  (mapData: PacmanMap, isAutoSave : boolean) => void;
	onCancel: () => void;
	initialMap?: string[];
	editingMap?: Partial<PacmanMap>;
}

const CreatePacmanMap: React.FC<CreatePacmanMapProps> = ({ state, onSave, onCancel, initialMap, editingMap }) => {
	const DEFAULT_ROWS = 29;
	const DEFAULT_COLS = 31;
	const DEFAULT_TILE_SIZE = 15;

	// État pourn stocker la grille de la carte
	const [grid, setGrid] = useState<string[]>(
		initialMap || Array(DEFAULT_ROWS).fill(' '.repeat(DEFAULT_COLS))
	);

	// État pour le nom de la carte avec valeur initiale
	const [mapName, setMapName] = useState<string>(editingMap?.name || '');
	// Vérifier si une carte initiale est fournie et mettre à jour le nom
	const [id, setId] = useState<number | undefined>(editingMap?.id);
	const [nameModified, setNameModified] = useState<boolean>(false);
	const [gridModified, setGridModified] = useState<boolean>(false);

	// État pour le dessin continu
	const [isDrawing, setIsDrawing] = useState<boolean>(false);
	
	// État pour le type de cellule sélectionné à placer
	const [selectedTile, setSelectedTile] = useState<string>('#'); // Mur par défaut

	// État pour les dimensions de la carte
	const [rows] = useState<number>(initialMap?.length || DEFAULT_ROWS);
	const [cols] = useState<number>(initialMap?.[0]?.length || DEFAULT_COLS);

	// Utiliser useEffect pour traiter initialMap au premier rendu
	useEffect(() => {
		if (initialMap && initialMap.length > 0) {
			setGrid(initialMap);
			
			// Si editingMap est fourni, mettre à jour les états
			if (editingMap) {
				setMapName(editingMap.name || 'Carte sans titre');
				setId(editingMap.id);
			}
		}
	}, [initialMap, editingMap]);

	// useEffect pour l'auto-sauvegarde
	useEffect(() => {
		if (!gridModified && !nameModified) return;
			const mapData = prepareMapData();
			onSave?.(mapData, true); // Auto-save
			setGridModified(false);
	}, [gridModified, nameModified, grid, mapName, id, state?.player?.id]);

	// Mettre à jour la grille lors du changement de dimensions

	const prepareMapData = (): PacmanMap => {
		// Identifier l'ID de la carte si elle existe déjà
		// Construire l'objet PacmanMap
		// save state 
		if (state?.maps) {
			const existingMapIndex = state.maps.findIndex(map => map.name === mapName);
			if (existingMapIndex !== -1) {
				state.maps[existingMapIndex] = {
					...state.maps[existingMapIndex],
					map: grid.map(row => row.split('')),
					name: mapName,
					is_valid: false,
					errors: [],
				};
			} else {
				state.maps.push({
					id : undefined, // ID sera défini plus tard
					user_id: state?.player?.id || 0,
					name: mapName,
					map: grid.map(row => row.split('')),
					is_public: false,
					is_valid: false,
					errors: [],
				});
			}
		}
		let tempId
		if (id === undefined) {
	
			tempId = state?.maps?.find(map => map.name === mapName)?.id;
			setId(tempId); // Trouver l'ID de la carte par son nom
			console.log('ID de la carte trouvée:', state?.maps?.find(map => map.name === mapName)?.id);
			console.log('ID de la nouvelle carte:', id);
			console.log('ID de la carte:', state?.maps);
		}
		else {
			tempId = id; // Conserver l'ID de la carte existante
		}
		return {
			id: tempId, // ID existant ou undefined pour nouvelle carte
			user_id: state?.player?.id || 0,
			name: mapName, // Toujours utiliser le nom actuel, pas le tempMapName
			map: grid.map(row => row.split('')),
			is_public: false,
			is_valid: true,
			errors: [],
		  };
	};
	
	// Fonction pour gérer le changement de nom de la carte
	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMapName(event.target.value);
		setNameModified(true); // Marquer le nom comme modifié
	  };


	useEffect(() => {
		const handleMouseDown = () => {
		  setIsDrawing(true);
		};
		
		const handleMouseUp = () => {
		  setIsDrawing(false);
		};
		
		// Ajouter les écouteurs d'événements
		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);
		
		// Nettoyer les écouteurs d'événements
		return () => {
		  document.removeEventListener('mousedown', handleMouseDown);
		  document.removeEventListener('mouseup', handleMouseUp);
		};
	  }, []);
	
	// Fonction pour mettre à jour une cellule de la grille
	const handleCellClick = (rowIndex: number, colIndex: number) => {
		const newGrid = [...grid];
		const rowChars = newGrid[rowIndex].split('');
		rowChars[colIndex] = selectedTile;
		newGrid[rowIndex] = rowChars.join('');
		setGrid(newGrid);
		setGridModified(true); // Marquer la grille comme modifiée
	};

	const handleCellEnter = (rowIndex: number, colIndex: number) => {
		// Vérifier si le dessin est actif
		if (isDrawing) {
		  // Appliquer le même comportement que pour un clic
		  handleCellClick(rowIndex, colIndex);
		}
	  };
	
	

	// Fonction pour sauvegarder la carte
	// Fonction pour sauvegarder la carte manuellement
	const saveMap = () => {
		// Vérifier que le nom de la carte est défini
		
		setMapName(mapName.trim());
		setNameModified(false);
		
		// Créer l'objet PacmanMap
		const mapData = prepareMapData();
		
		// Envoyer au parent pour sauvegarde
		onSave?.(mapData, false);
	};

	// Fonction pour remplir les bordures de murs
	const addBorders = () => {
		const newGrid = [...grid];

		// Remplir première et dernière ligne
		newGrid[0] = '#'.repeat(cols);
		newGrid[rows - 1] = '#'.repeat(cols);

		// Remplir première et dernière colonne de chaque ligne
		for (let i = 1; i < rows - 1; i++) {
			const rowChars = newGrid[i].split('');
			rowChars[0] = '#';
			rowChars[cols - 1] = '#';
			newGrid[i] = rowChars.join('');
		}

		setGrid(newGrid);
	};

	return (
		<div className="create-pacman-map">
			<h2>Créer une carte Pacman</h2>
			<div className="map-name">
				<label htmlFor="mapName">Nom de la carte:</label>
				<input
					type="text"
					id="mapName"
					value={mapName}
					onChange={handleNameChange}
					placeholder="Nom de la carte"
				/>
			</div>

			<div className="editor-container">
				{/* Left Panel - Tile Selector */}
				<div className="left-panel">
					<h3>Tiles</h3>
					<div className="tile-selector">
						<div
							className={`tile-option ${selectedTile === '#' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('#')}
						>
							<div className="tile wall"></div>
							<span>Mur</span>
						</div>

						<div
							className={`tile-option ${selectedTile === ' ' ? 'selected' : ''}`}
							onClick={() => setSelectedTile(' ')}
						>
							<div className="tile empty"></div>
							<span>Vide</span>
						</div>

						<div
							className={`tile-option ${selectedTile === '.' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('.')}
						>
							<div className="tile pellet">
								<div className="dot"></div>
							</div>
							<span>Pastille</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'o' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('o')}
						>
							<div className="tile power-pellet">
								<div className="big-dot"></div>
							</div>
							<span>Super pastille</span>
						</div>

						<div
							className={`tile-option ${selectedTile === '-' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('-')}
						>
							<div className="tile door">
								<div className="door-line"></div>
							</div>
							<span>Porte</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'T' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('T')}
						>
							<div className="tile tunnel">T</div>
							<span>Tunnel</span>
						</div>

						{/* Points de spawn */}
						<div
							className={`tile-option ${selectedTile === 'P' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('P')}
						>
							<div className="tile spawn spawn-pacman">P</div>
							<span>Spawn Pacman</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'B' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('B')}
						>
							<div className="tile spawn spawn-blinky">B</div>
							<span>Spawn Blinky</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'I' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('I')}
						>
							<div className="tile spawn spawn-inky">I</div>
							<span>Spawn Inky</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'Y' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('Y')}
						>
							<div className="tile spawn spawn-pinky">Y</div>
							<span>Spawn Pinky</span>
						</div>

						<div
							className={`tile-option ${selectedTile === 'C' ? 'selected' : ''}`}
							onClick={() => setSelectedTile('C')}
						>
							<div className="tile spawn spawn-clyde">C</div>
							<span>Spawn Clyde</span>
						</div>
					</div>
				</div>

				{/* Main Content */}
				{/* Center Panel - Map Editor */}
				<div className="main-content">
					<div className="toolbar">
						<div className="tool-group">
							<button onClick={addBorders}>Ajouter bordures</button>
							<button onClick={saveMap}>Sauvegarder</button>
							<button onClick={onCancel}>Retour</button>
						</div>
					</div>
					
					{/* Utiliser le nouveau composant Editor */}
					<Editor
						grid={grid}
						DEFAULT_TILE_SIZE={DEFAULT_TILE_SIZE}
						isSpawnPoint={isSpawnPoint}
						getSpawnColor={getSpawnColor}
						getCellClass={getCellClass}
						handleCellClick={(rowIndex, colIndex) => {
							handleCellClick(rowIndex, colIndex);
							setGridModified(true);
						}}
						handleCellEnter={handleCellEnter}
					/>
				</div>
				<div className='right-panel'>
					{/* Right Panel - Preview */}
					<div className="map-preview">
						<h3>Aperçu de la carte</h3>
						<pre className="map-code">
							{grid.join('\n')}
						</pre>
					</div>
				</div>
			</div>

			<div className="map-console">
				<h3>Console</h3>
				<pre className="console-output">
					{state?.maps
					?.filter(map => map.id === id && !map.is_valid && map.errors && map.errors.length > 0)
					.map((map, index) => (
						<div key={index} className="console-error">
							<div className="error-header">❌ Erreurs dans la carte "{map.name}":</div>
							<div className="error-list">
							  {map.errors && map.errors.map((error, errorIndex) => (
							    <div key={errorIndex} className="error-item">• {error}</div>
							  ))}
							</div>
						</div>
					))}
				</pre>
			</div>
		</div>
	);
};

export default CreatePacmanMap;