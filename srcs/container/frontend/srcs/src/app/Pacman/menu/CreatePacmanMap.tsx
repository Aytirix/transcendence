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
	// Nom temporaire pour l'édition (ne sera pasa utilisé pour les auto-sauvegardes)
	const [id, setId] = useState<number | undefined>(editingMap?.id);
	// Remove anti-pattern: do not call setId in render body
	// Instead, useEffect to sync id if needed
	useEffect(() => {
	  if (id === undefined && initialMap && mapName) {
	    const existingMap = state?.maps?.find(map => map.name === mapName);
	    if (existingMap) {
	      setId(existingMap.id);
	    }
	  } else if (editingMap?.id !== undefined && editingMap?.id !== id) {
	    setId(editingMap.id);
	  }
	}, [id, initialMap, mapName, state?.maps, editingMap?.id]);

	const [nameModified, setNameModified] = useState<boolean>(false);
	
	const [gridModified, setGridModified] = useState<boolean>(false);

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
				setMapName(editingMap.name || '');
				setId(editingMap.id);
			}
		}
	}, [initialMap, editingMap]);

	// useEffect pour l'auto-sauvegarde
	useEffect(() => {
		if (!gridModified && !nameModified)return;
		if (!mapName) {
			//alert('Veuillez entrer un nom pour la carte.');
			return;
		}

		const mapData = prepareMapData();
		onSave?.(mapData, true); // Auto-save
		setId(mapData.id); // Mettre à jour l'ID si nécessaire
		console.log('Auto-sauvegarde de la carte:', mapData);
		setGridModified(false);
		setNameModified(false);
	}, [gridModified, nameModified, grid, mapName, id, state?.player?.id]);

	// Mettre à jour la grille lors du changement de dimensions

	const prepareMapData = (): PacmanMap => {
		// Identifier l'ID de la carte si elle existe déjà
		// Construire l'objet PacmanMap
		// save state 
		if (state?.maps) {
			let existingMapIndex;
			if (id !== undefined) {
				// Si l'ID est défini, mettre à jour la carte existante
				existingMapIndex = state.maps.findIndex(map => map.id === id);
			} else if (mapName) {
				// Si l'ID n'est pas défini, chercher par nom
				existingMapIndex = state.maps.findIndex(map => map.name === mapName);
			}
			else {
				// Si ni l'ID ni le nom ne sont définis 
				existingMapIndex = -1; // Aucune carte existante à mettre à jour
			}
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
		if (id !== undefined) {
			tempId = id; // Conserver l'ID de la carte existante
		}
		else if (mapName && state?.maps) {
			// Si l'ID n'est pas défini, chercher par nom
			tempId = state?.maps?.find(map => map.name === mapName)?.id;
			if (tempId !== undefined) {
				setId(tempId); // Mettre à jour l'ID si trouvé
				console.log('ID de la carte trouvée:', tempId);
			} else {
				console.log('Aucune carte trouvée avec le nom:', mapName);
			}
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
		if (selectedTile === 'P' || selectedTile === 'B' || selectedTile === 'I' || selectedTile === 'Y' || selectedTile === 'C') {
			// Vérifier s'il y a déjà un point de spawn pour le même type
			const spawnChar = selectedTile;
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					if (i !== rowIndex || j !== colIndex) { // Ne pas vérifier la cellule actuelle
						if (newGrid[i][j] === spawnChar) {
							newGrid[i] = newGrid[i].substring(0, j) + ' ' + newGrid[i].substring(j + 1);
						}
					}
				}
			}
		}
		// pour les tunnel il doivent etre en paire et les deux doivent etre en face à face
		setGrid(newGrid);
		setGridModified(true); // Marquer la grille comme modifiée
		// Update tunnel pairing after grid change
		//updateTunnelPairing(newGrid);
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
		if (!mapName){
			//alert('Veuillez entrer un nom pour la carte.');
			return;
		}
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
// Add state for modal input
	const [tempMapName, setTempMapName] = useState<string>("");
	// Utility to update tunnel pairing CSS

	// Optionally, also update tunnel pairing after grid changes from other sources

	return (
		<div className="create-pacman-map">
			<h2>Créer une carte Pacman</h2>
			{/* Replace the map name input with a modal if mapName is empty */}
			{!mapName && (
			<div className="modal-overlay">
				<div className="modal-content">
				<h3>Nom de la carte</h3>
				<form onSubmit={e => {
					e.preventDefault();
					const name = tempMapName.trim();
					const nameExists = state?.maps?.some(map => map.name === name);
					if (name && !nameExists) {
					setMapName(name);
					setNameModified(true);
					}
				}}>
					<input
					type="text"
					value={tempMapName}
					onChange={e => setTempMapName(e.target.value)}
					placeholder="Entrez le nom de la carte"
					autoFocus
					/>
					{tempMapName.trim() && state?.maps?.some(map => map.name === tempMapName.trim()) && (
					<div className='error_name' style={{ color: 'red', fontSize: 15, marginBottom: 8 }}>
						Ce nom existe déjà. Choisissez un autre nom.
					</div>
					)}
					<br />
					<button type="submit"
					disabled={!tempMapName.trim() || state?.maps?.some(map => map.name === tempMapName.trim())}
					>Valider</button>
				</form>
				</div>
			</div>
			)}
			<div className="map-name" style={{ filter: !mapName ? 'blur(2px)' : undefined, pointerEvents: !mapName ? 'none' : undefined }}>
				<label htmlFor="mapName">Nom de la carte:</label>
				<input
					type="text"
					id="mapName"
					value={mapName}
					onChange={handleNameChange}
					placeholder="Nom de la carte"
					disabled={!mapName}
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