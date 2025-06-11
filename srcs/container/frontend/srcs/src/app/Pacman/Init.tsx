import { useEffect, useState } from 'react';
import ApiService from '../../api/ApiService';
import { useSafeWebSocket, WebSocketStatus } from '../../api/useSafeWebSocket';
import { state, PacmanMap } from '../types/pacmanTypes';
import { CenteredBox } from './menu/CenteredBox';
import { useAuth } from '../../contexts/AuthContext';
import PacmanGame from './theojeutmp/PacmanGame';
import CreatePacmanMap from './menu/CreatePacmanMap'; // Import the map editor
import '../assets/styles/Star.scss';

function initState(): state {
	const state: state = {
		ws: null,
		statusws: 'Connecting...',
		player: useAuth().user,
		maps: [],
		rooms: {
			active: [],
			waiting: [],
		},
		game: {
			launch: false,
			grid: [],
			frightenedState: {
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
	const [state, setState] = useState<state>(initState());
	const [showMapEditor, setShowMapEditor] = useState(false);
	const [editingMapData, setEditingMapData] = useState<Partial<PacmanMap> | null>(null);
	const [initialMapData, setInitialMapData] = useState<string[] | null>(null);

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
				console.log('Search results:', data.data.maps);
				break;
			}
			case 'insertOrUpdateMap': {
				setState((prevState: state) => {
					console.log('old maps:', prevState.maps);
					console.log('old maps :', data.data.map);
					if (data.data.isCreated) {
						const newMapIndex = prevState.maps.findIndex(map => data.data.map.id === map.id);
						if (newMapIndex !== -1) {
							const updatedMaps = [...prevState.maps];
							updatedMaps[newMapIndex] = data.data.map;
							console.log('new maps:', updatedMaps);
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
						console.log('Map updated:', data.data.map.name);
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
				console.log('Unknown action:', data.data.action);
				break;
		}
	};
	const handleSaveMap = (mapData: PacmanMap, isAutoSave: boolean = false) => {
		console.log('handleSaveMap state :', state.maps);
		console.log('handleSaveMap mapData:', mapData);
		if (isAutoSave) {
			console.log('Auto-saving map...', mapData.name);
		} else {
			console.log('Manually saving map...', mapData.name);
		}

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
		reconnectDelay: 1000,
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
			<div className="bg-gray-200 text-white flex flex-col items-center justify-center">
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
