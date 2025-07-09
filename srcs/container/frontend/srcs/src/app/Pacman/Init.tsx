import { useEffect, useState } from 'react';
import { useSafeWebSocket, WebSocketStatus } from '../../api/useSafeWebSocket';
import { state, PacmanMap } from '../types/pacmanTypes';
import { CenteredBox } from './menu/CenteredBox';
import { useAuth } from '../../contexts/AuthContext';
import PacmanGame from './game/PacmanGame';
import CreatePacmanMap from './menu/CreatePacmanMap'; // Import the map editor
import '../assets/styles/Star.scss';
import { VolumeControl } from './components/VolumeControl';

function initState(): state {
	const state: state = {
		ws: null,
		statusws: 'Connecting...',
		player: null, // Will be set in the component
		maps: [],
		rooms: {
			active: [],
			waiting: [],
		},
		game: {
			launch: false,
			grid: [],
			frightenedState: {
				active: false,
				remainingTime: 0,
			},
			players: [],
			tileSize: 50,
			isSpectator: false,
			pacmanLife: 3,
			paused: {
				paused: false,
				message: '',
			},
		},
	};
	return state;
}

export default function WebSocketPacman() {
	const { user } = useAuth();
	const [state, setState] = useState<state>(initState());
	const [showMapEditor, setShowMapEditor] = useState(false);
	const [editingMapData, setEditingMapData] = useState<Partial<PacmanMap> | null>(null);
	const [initialMapData, setInitialMapData] = useState<string[] | null>(null);

	// Initialize player when user is available
	useEffect(() => {
		if (user) {
			setState(prevState => ({
				...prevState,
				player: user
			}));
		}
	}, [user]);

	const handleEditMap = (map: PacmanMap) => {
		const fullMap = state.maps.find(m => m.id === map.id);

		if (!fullMap) {
			console.error('Carte non trouvée:', map.id);
			return;
		}

		const initialMapData = fullMap.map.map(row => row.join(''));

		setEditingMapData({
			id: fullMap.id,
			name: fullMap.name,
			is_public: fullMap.is_public,
			is_valid: fullMap.is_valid,
			errors: fullMap.errors || []
		});
		setInitialMapData(initialMapData);
		setShowMapEditor(true);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleMessage = (data: any) => {
		switch (data.action) {
			case 'getrooms': {
				setState((prevState: state) => ({
					...prevState,
					rooms: {
						waiting: data.waiting,
						active: data.active,
					},
					game: {
						...prevState.game,
						launch: false,
						grid: [],
						players: [],
						paused: {
							paused: false,
							message: '',
						},
					},
				}));
				break;
			}
			case 'updateGame': {

				setState((prevState: state) => ({
					...prevState,
					game: {
						...prevState.game,
						launch: true,
						grid: data.data.grid,
						players: data.data.players,
						paused: data.data.paused,
						frightenedState: data.data.frightenedState || prevState.game.frightenedState,
						pacmanLife: data.data.pacmanLife !== undefined ? data.data.pacmanLife : prevState.game.pacmanLife,
						tileSize: data.data.tileSize || prevState.game.tileSize,
						isSpectator: data.data.isSpectator !== undefined ? data.data.isSpectator : prevState.game.isSpectator,
					},
				}));
				break;
			}
			case 'getAllMapsForUser': {
				setState((prevState: state) => ({
					...prevState,
					maps: data.data.maps || [],
				}));
				break;
			}
			case 'deleteMap': {
				setState((prevState: state) => ({
					...prevState,
					maps: prevState.maps.filter((map) => map.id !== data.id),
				}));
				break;
			}
			case 'searchMap': {
				setState((prevState: state) => ({
					...prevState,
					publicMaps: data.data.maps || [],
				}));
				break;
			}
			case 'insertOrUpdateMap': {
				setState((prevState: state) => {
					
					// Mettre à jour les données de téléporteurs s'il y en a
					if (data.data.map.teleportMap && data.data.map.unassignedTeleports) {
						// Convertir la structure du backend vers la structure attendue par le frontend
						const teleportMapArray = Object.values(data.data.map.teleportMap) as Array<Array<{x: number, y: number}>>;
						const unassignedTeleportsArray = Object.values(data.data.map.unassignedTeleports) as Array<{x: number, y: number}>;
						setEditorTeleportData({
							teleportMap: teleportMapArray,
							unassignedTeleports: unassignedTeleportsArray
						});
					}
					
					if (data.data.isCreated) {
						const newMapIndex = prevState.maps.findIndex(map => data.data.map.id === map.id);
						if (newMapIndex !== -1) {
							const updatedMaps = [...prevState.maps];
							updatedMaps[newMapIndex] = data.data.map;
							return {
								...prevState,
								maps: updatedMaps
							};
						}
					}
					const mapIndex = prevState.maps.findIndex((map) => map.name === data.data.map.name);
					if (mapIndex !== -1) {
						const updatedMaps = [...prevState.maps];
						updatedMaps[mapIndex] = data.data.map;
						return {
							...prevState,
							maps: updatedMaps
						};
					} else {
						return {
							...prevState,
						};
					}
				});
				break;
			}
			default:
				break;
		}
	};
	const handleSaveMap = (mapData: PacmanMap, isAutoSave: boolean = false) => {

		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
			state.ws.send(JSON.stringify({
				action: 'insertOrUpdateMap',
				mapData,
				isAutoSave,
			}));
		}

		if (!isAutoSave && mapData.is_valid) {
			setShowMapEditor(false);
		}
	};

	// Gestion des téléporteurs pour l'éditeur de carte
	const [editorTeleportData, setEditorTeleportData] = useState<{
		teleportMap: Array<Array<{x: number, y: number}>>,
		unassignedTeleports: Array<{x: number, y: number}>
	}>({
		teleportMap: [],
		unassignedTeleports: []
	});

	const handleTeleportDataUpdate = (teleportMap: Array<Array<{x: number, y: number}>>, unassignedTeleports: Array<{x: number, y: number}>) => {
		setEditorTeleportData({ teleportMap, unassignedTeleports });
	};

	const resetState = (status: WebSocketStatus) => {
		setState((prevState) => ({
			...prevState,
			statusws: status,
			rooms: status !== 'Connected' ? { active: [], waiting: [] } : prevState.rooms,
			game: status !== 'Connected'
				? {
					launch: false,
					grid: [],
					players: [],
					tileSize: 50,
					frightenedState: {
						active: false,
						remainingTime: 0,
					},
					isSpectator: false,
					pacmanLife: 3,
					paused: {
						paused: false,
						message: '',
					},
				}
				: prevState.game,
		}));
	};

	const websocket = useSafeWebSocket({
		endpoint: '/Pacman',
		onMessage: handleMessage,
		onStatusChange: resetState,
		pingInterval: 1000,
	});


	useEffect(() => {
		setState((prevState) => ({
			...prevState,
			ws: websocket,
		}));

		return () => {
			websocket?.close();
		};
	}, [websocket]);
	
	return (
		<div id="PacmanStars">
			<div className="star-background">
				<div id="stars-bright"></div>
				<div id="shooting-stars">
					<span></span><span></span><span></span><span></span><span></span>
				</div>
			</div>
			<div className="pacman-content-wrapper">
				<div className="flex items-center mb-4">
					<VolumeControl />
				</div>
				{showMapEditor ? (
					<CreatePacmanMap
						state={state}
						onSave={handleSaveMap}
						onCancel={() => {
							setShowMapEditor(false);
							setEditingMapData(null);
							setInitialMapData(null);
						}}
						initialMap={initialMapData || undefined}
						editingMap={editingMapData || undefined}
						onTeleportDataUpdate={handleTeleportDataUpdate}
						initialTeleportData={editorTeleportData}
					/>
				) : state.game.grid && state.game.grid.length > 0 ? (
					<PacmanGame state={state} />
				) : (
					<CenteredBox
						state={state}
						onCreateMap={() => setShowMapEditor(true)}
						onEditMap={handleEditMap}
					/>
				)}
			</div>
		</div>
	);
}
