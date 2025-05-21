import { useEffect, useState } from 'react';
import ApiService from '../../api/ApiService';
import { useSafeWebSocket, WebSocketStatus } from '../../api/useSafeWebSocket';
import { state } from '../types/pacmanTypes';
import { CenteredBox } from './menu/CenteredBox';
import { useAuth } from '../../contexts/AuthContext';
import PacmanMap from './theojeutmp/PacmanMap';

function initState(): state {
	const state: state = {
		ws: null,
		statusws: 'Connecting...',
		player: useAuth().user,
		rooms: {
			active: [],
			waiting: [],
		},
		game: {
			grid: [],
			players: [],
			tileSize: 50,
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

	const handleMessage = (data: any) => {
		switch (data.action) {
			case 'getrooms': {
				setState((prevState: state) => ({
					...prevState,
					rooms: {
						waiting: data.waiting,
						active: data.active,
					},
				}));
				break;
			}
			case 'startGame': {
				setState((prevState: state) => ({
					...prevState,
					game: {
						...prevState.game,
						players: data.data.players,
						grid: data.data.grid,
						tileSize: data.data.tileSize,
						paused: data.data.paused,
					},
				}));
				break;
			}
			case 'updateGame': {
				setState((prevState: state) => ({
					...prevState,
					game: {
						...prevState.game,
						grid: data.data.grid,
						players: data.data.players,
						paused: data.data.paused,
					},
				}));
				break;
			}
			default:
				console.log('Unknown action:', data.action);
				break;
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;

		const keyActions: Record<string, string> = {
			'ArrowUp': 'UP',
			'ArrowDown': 'DOWN',
			'ArrowLeft': 'LEFT',
			'ArrowRight': 'RIGHT'
		};

		const direction = keyActions[event.key];
		if (direction) {
			state.ws.send(JSON.stringify({
				action: 'playerMove',
				direction: direction
			}));
			event.preventDefault();
		}
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [state.ws]);

	const resetState = (status: WebSocketStatus) => {
		setState((prevState) => ({
			...prevState,
			statusws: status,
			rooms: status !== 'Connected' ? { active: [], waiting: [] } : prevState.rooms,
			game: status !== 'Connected'
				? {
					grid: [],
					players: [],
					tileSize: 50,
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
			{state.game.grid && state.game.grid.length > 0 ? (
				<PacmanMap state={state} />
			) : (
				<CenteredBox state={state} />
			)}
		</div>
	);
}
