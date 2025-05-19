import { useEffect, useState } from 'react';
import ApiService from '../../api/ApiService';
import { useSafeWebSocket } from '../../api/useSafeWebSocket';
import { state } from '../types/pacmanTypes';
import { CenteredBox } from './menu/CenteredBox';
import { useAuth } from '../../contexts/AuthContext';

function initState(): state {
	const state: state = {
		ws: null,
		statusws: 'Connecting...',
		player: useAuth().user,
		rooms: {
			active: [],
			waiting: [],
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

	const websocket = useSafeWebSocket({
		endpoint: '/Pacman',
		onMessage: handleMessage,
		onStatusChange: (status) => {
			setState((prevState) => ({ ...prevState, statusws: status }));
		},
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
			<CenteredBox state={state} />
		</div>
	);
}
