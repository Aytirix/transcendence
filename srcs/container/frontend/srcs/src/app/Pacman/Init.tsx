import { useEffect, useState } from 'react';
import ApiService from '../../api/ApiService';
import { useSafeWebSocket, WebSocketStatus } from '../../api/useSafeWebSocket';
import { state, PacmanMap } from '../types/pacmanTypes';
import { CenteredBox } from './menu/CenteredBox';
import { useAuth } from '../../contexts/AuthContext';
import PacmanGame from './theojeutmp/PacmanGame';
import CreatePacmanMap from './menu/CreatePacmanMap'; // Import the map editor

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
	const [showMapEditor, setShowMapEditor] = useState(false); // Add this state

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
			case 'getAllMapForUser': {
				setState((prevState: state) => ({
					...prevState,
					maps: data.maps || [],
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
			case 'insertOrUpdateMap': {
				setState((prevState: state) => {
					// Créer un nouveau tableau avec toutes les cartes sauf celle qui est mise à jour
					const updatedMaps = prevState.maps.filter((map) => map.id !== data.map.id);
					// Ajouter la carte mise à jour
					updatedMaps.push(data.map);
					
					return {
					  ...prevState,
					  maps: updatedMaps // Assigner directement le tableau
					};
				});
				break;
			}
			default:
				console.log('Unknown action:', data.action);
				break;
		}
	};
	const handleSaveMap = (mapData: PacmanMap, isAutoSave: boolean = false) => {
		// Check if it's an auto-save or manual save
		if (isAutoSave) {
			console.log('Auto-saving map...', mapData.name);
		} else {
			console.log('Manually saving map...', mapData.name);
		}

		// Implement logic to save the map to your backend
		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
			state.ws.send(JSON.stringify({
				action: 'insertOrUpdateMap',
				mapData,
				isAutoSave,
			}));
		}

		if (!isAutoSave) {
			setShowMapEditor(false); // Close the editor after manual saving
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
		<div className="bg-gray-200 text-white flex flex-col items-center justify-center">
			{showMapEditor ? (
				<CreatePacmanMap state={state} onSave={handleSaveMap} onCancel={() => setShowMapEditor(false)} />
			) : state.game.grid && state.game.grid.length > 0 ? (
				<PacmanGame state={state} />
			) : (
				<CenteredBox
					state={state}
					onCreateMap={() => setShowMapEditor(true)} // Pass this prop to CenteredBox
				/>
			)}
		</div>
	);
}
