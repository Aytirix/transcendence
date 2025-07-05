import { useState, useEffect } from 'react';
import { state, PacmanMap } from '../../../types/pacmanTypes';

interface UseMapEditorProps {
	state: state;
	initialMap?: string[];
	editingMap?: Partial<PacmanMap>;
	onSave?: (mapData: PacmanMap, isAutoSave: boolean) => void;
	onTeleportDataUpdate?: (teleportMap: Array<Array<{x: number, y: number}>>, unassignedTeleports: Array<{x: number, y: number}>) => void;
	initialTeleportData?: {
		teleportMap: Array<Array<{x: number, y: number}>>,
		unassignedTeleports: Array<{x: number, y: number}>
	};
}

export const useMapEditor = ({ 
	state, 
	initialMap, 
	editingMap, 
	onSave,
	onTeleportDataUpdate,
	initialTeleportData
}: UseMapEditorProps) => {
	const DEFAULT_ROWS = 31;
	const DEFAULT_COLS = 29;

	// États pour la grille et métadonnées
	const [grid, setGrid] = useState<string[]>(
		initialMap || Array(DEFAULT_ROWS).fill(' '.repeat(DEFAULT_COLS))
	);
	const [mapName, setMapName] = useState<string>(editingMap?.name || '');
	const [id, setId] = useState<number | undefined>(editingMap?.id);
	const [nameModified, setNameModified] = useState<boolean>(false);
	const [gridModified, setGridModified] = useState<boolean>(false);
	
	// États pour les téléporteurs
	const [teleportMap, setTeleportMap] = useState<Array<Array<{x: number, y: number}>>>(
		initialTeleportData?.teleportMap || []
	);
	const [unassignedTeleports, setUnassignedTeleports] = useState<Array<{x: number, y: number}>>(
		initialTeleportData?.unassignedTeleports || []
	);

	// États pour l'interaction
	const [isDrawing, setIsDrawing] = useState<boolean>(false);
	const [selectedTile, setSelectedTile] = useState<string>('#');
	const [tempMapName, setTempMapName] = useState<string>("");

	// Dimensions
	const [rows] = useState<number>(initialMap?.length || DEFAULT_ROWS);
	const [cols] = useState<number>(initialMap?.[0]?.length || DEFAULT_COLS);

	// Synchronisation de l'ID
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

	// Initialisation avec une carte existante
	useEffect(() => {
		if (initialMap && initialMap.length > 0) {
			setGrid(initialMap);
			
			if (editingMap) {
				setMapName(editingMap.name || '');
				setId(editingMap.id);
			}
		}
	}, [initialMap, editingMap]);

	// Synchronisation des données de téléporteurs
	useEffect(() => {
		if (initialTeleportData) {
			setTeleportMap(initialTeleportData.teleportMap);
			setUnassignedTeleports(initialTeleportData.unassignedTeleports);
		}
	}, [initialTeleportData]);

	// Fonction pour préparer les données de la carte
	const prepareMapData = (): PacmanMap => {
		if (state?.maps) {
			let existingMapIndex;
			if (id !== undefined) {
				existingMapIndex = state.maps.findIndex(map => map.id === id);
			} else if (mapName) {
				existingMapIndex = state.maps.findIndex(map => map.name === mapName);
			} else {
				existingMapIndex = -1;
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
					id: undefined,
					user_id: state?.player?.id || 0,
					name: mapName,
					map: grid.map(row => row.split('')),
					is_public: state?.maps?.some(map => map.name === mapName && map.is_public) || false,
					is_valid: false,
					errors: [],
				});
			}
		}

		let tempId = id;
		if (id === undefined && mapName && state?.maps) {
			tempId = state?.maps?.find(map => map.name === mapName)?.id;
			if (tempId !== undefined) {
				setId(tempId);
			}
		}

		return {
			id: tempId,
			user_id: state?.player?.id || 0,
			name: mapName,
			map: grid.map(row => row.split('')),
			is_public: state?.maps?.some(map => map.name === mapName && map.is_public) || false,
			is_valid: true,
			errors: [],
		};
	};
	
	// Fonction pour mettre à jour les données des téléporteurs
	const updateTeleportData = (newTeleportMap: Array<Array<{x: number, y: number}>>, newUnassignedTeleports: Array<{x: number, y: number}>) => {
		setTeleportMap(newTeleportMap);
		setUnassignedTeleports(newUnassignedTeleports);
		if (onTeleportDataUpdate) {
			onTeleportDataUpdate(newTeleportMap, newUnassignedTeleports);
		}
	};

	// Auto-sauvegarde
	useEffect(() => {
		if (!gridModified && !nameModified) return;
		if (!mapName) return;

		const mapData = prepareMapData();
		onSave?.(mapData, true);
		setId(mapData.id);
		setGridModified(false);
		setNameModified(false);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gridModified, nameModified, grid, mapName, id, state?.player?.id]);

	return {
		// États
		grid,
		setGrid,
		mapName,
		setMapName,
		id,
		nameModified,
		setNameModified,
		gridModified,
		setGridModified,
		isDrawing,
		setIsDrawing,
		selectedTile,
		setSelectedTile,
		tempMapName,
		setTempMapName,
		rows,
		cols,
		teleportMap,
		setTeleportMap,
		unassignedTeleports,
		setUnassignedTeleports,

		// Fonctions
		prepareMapData,
		updateTeleportData,
	};
};
