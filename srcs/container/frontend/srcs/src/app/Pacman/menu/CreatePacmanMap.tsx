// src/components/pacman/CreatePacmanMap.tsx
import React, { useState, useEffect } from 'react';
// import './CreatePacmanMap.scss';
import { state, PacmanMap } from '../../types/pacmanTypes';
import { set } from 'date-fns';

interface CreatePacmanMapProps {
	state: state;
	onSave?:  (mapData: PacmanMap, isAutoSave : boolean) => void;
	onCancel: () => void;
	initialMap?: string[];
}


const CreatePacmanMap: React.FC<CreatePacmanMapProps> = ({ onSave, initialMap, onCancel, state }) => {
	const DEFAULT_ROWS = 29;
	const DEFAULT_COLS = 31;
	const DEFAULT_TILE_SIZE = 15;

	// État pourn stocker la grille de la carte
	const [grid, setGrid] = useState<string[]>(initialMap || Array(DEFAULT_ROWS).fill(' '.repeat(DEFAULT_COLS)));

	// État pour le nom de la carte avec valeur initiale
	const [mapName, setMapName] = useState<string>('');
	// Nom temporaire pour l'édition (ne sera pasa utilisé pour les auto-sauvegardes)
	const [id, setId] = useState<number | undefined>(undefined);
	const [nameModified, setNameModified] = useState<boolean>(false);
	// Utiliser useEffect pour mettre à jour le nom dem la carte si un conflit est détecté

	// État pour suivre si la grille a été modifiée 
	const [gridModified, setGridModified] = useState<boolean>(false);

	// État pour le type de cellule sélectionné à placer
	const [selectedTile, setSelectedTile] = useState<string>('#'); // Mur par défaut

	// État pour les dimensions de la carte
	const [rows] = useState<number>(initialMap?.length || DEFAULT_ROWS);
	const [cols] = useState<number>(initialMap?.[0]?.length || DEFAULT_COLS);


	  
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
			/* setId(state?.maps?.findIndex((map) => map.id === mapName?.id); // Mettre à jour l'ID si la carte existe déjà */
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
	
	useEffect(() => {
		if (!gridModified && !nameModified) return;

		const autoSaveTimeout = setTimeout(() => {
			
			// Maintenant préparer les données avec le nom mis à jour
			const mapData = prepareMapData();
			onSave?.(mapData, true);
			setGridModified(false);
		  }, 1500); // 1.5 secondes après la dernière modification
		  
		  return () => clearTimeout(autoSaveTimeout);
	}, [gridModified, nameModified, grid, state?.player?.id]);
		
	// Fonction pour gérer le changement de nom de la carte
	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMapName(event.target.value);
		setNameModified(true); // Marquer le nom comme modifié
	  };

	// Fonction pour mettre à jour une cellule de la grille
	const handleCellClick = (rowIndex: number, colIndex: number) => {
		const newGrid = [...grid];
		const rowChars = newGrid[rowIndex].split('');
		rowChars[colIndex] = selectedTile;
		newGrid[rowIndex] = rowChars.join('');
		setGrid(newGrid);
		setGridModified(true); // Marquer la grille comme modifiée
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

	// Obtenir la couleur pour chaque type de spawn
	const getSpawnColor = (char: string): string => {
		switch (char) {
			case 'P': return 'yellow';
			case 'B': return 'red';
			case 'I': return 'blue';
			case 'Y': return 'pink';
			case 'C': return 'orange';
			default: return 'transparent';
		}
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

					<div className="map-editor">
						<div className="grid-container">
							{grid.map((row, rowIndex) => (
								<div key={`row-${rowIndex}`} className="grid-row">
									{row.split('').map((cell, colIndex) => (
										<div
											key={`cell-${rowIndex}-${colIndex}`}
											className={`grid-cell ${getCellClass(cell)}`}
											style={{
												width: DEFAULT_TILE_SIZE,
												height: DEFAULT_TILE_SIZE,
												...(isSpawnPoint(cell) ? { backgroundColor: getSpawnColor(cell) } : {})
											}}
											onClick={() => {handleCellClick(rowIndex, colIndex); onSave?.(prepareMapData(), true);}}
										>
											{cell === '.' && <div className="dot" />}
											{cell === 'o' && <div className="big-dot" />}
											{cell === '-' && <div className="door-line" />}
											{cell === 'T' && <span>T</span>}
											{isSpawnPoint(cell) && <span className="spawn-label">{cell}</span>}
										</div>
									))}
								</div>
							))}
						</div>
					</div>
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


// Fonction pour déterminer si un caractère est un point de spawn
const isSpawnPoint = (char: string): boolean => {
	return ['P', 'B', 'I', 'Y', 'C'].includes(char);
};

// Fonction pour déterminer la classe CSS de chaque cellule
const getCellClass = (char: string): string => {
	switch (char) {
		case '#': return 'wall';
		case '.': return 'pellet';
		case 'o': return 'power-pellet';
		case '-': return 'door';
		case 'T': return 'tunnel';
		case ' ': return 'empty';
		case 'P': return 'spawn spawn-pacman';
		case 'B': return 'spawn spawn-blinky';
		case 'I': return 'spawn spawn-inky';
		case 'Y': return 'spawn spawn-pinky';
		case 'C': return 'spawn spawn-clyde';
		default: return 'empty';
	}
};

export default CreatePacmanMap;