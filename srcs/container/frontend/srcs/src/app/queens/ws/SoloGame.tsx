import { useState, useEffect, useCallback } from 'react';
import { Game, NotificationMessage, SoloGameHook, UpdateParameters } from '../types';
import { useSafeWebSocket } from '../../../api/useSafeWebSocket';

const SoloGame = (): SoloGameHook => {
	// Fonction pour charger le jeu depuis le localStorage
	const loadGameFromStorage = useCallback((): Game | null => {
		try {
			const savedGame = localStorage.getItem('queens-game');
			if (savedGame) {
				return JSON.parse(savedGame);
			}
		} catch (error) {
			console.error('Erreur lors du chargement du jeu depuis localStorage:', error);
		}
		return null;
	}, []);

	// Fonction pour sauvegarder le jeu dans le localStorage
	const saveGameToStorage = useCallback((game: Game) => {
		try {
			localStorage.setItem('queens-game', JSON.stringify(game));
		} catch (error) {
			console.error('Erreur lors de la sauvegarde du jeu dans localStorage:', error);
		}
	}, []);

	const [game, setGame] = useState<Game | null>(loadGameFromStorage);
	const [notifMessage, setNotifMessage] = useState<NotificationMessage>({ message: '', type: '' });
	const [isConnected, setIsConnected] = useState<boolean>(false);

	const handleMessage = useCallback((event: any) => {
		if (event.status === 'success') {
			const { setting, map, state } = event.game;
			const newGame = {
				setting: {
					...setting,
					autoCross: Boolean(setting.autoCross)
				},
				map,
				state,
			};
			setGame(newGame);
			// Sauvegarder automatiquement dans localStorage
			saveGameToStorage(newGame);
			if (event.message) {
				setNotifMessage(event.message);
			}
		} else {
			setNotifMessage(event.message);
		}
	}, [saveGameToStorage]);

	const handleStatusChange = useCallback((status: string) => {
		if (status === 'Connected') {
			setIsConnected(true);
		} else if (status === 'Closed' || status === 'Error') {
			setIsConnected(false);
			setNotifMessage({ message: 'Connexion perdue, tentative de reconnexion...', type: 'info' });
		}
	}, []);

	const socket = useSafeWebSocket({
		endpoint: '/queens',
		onMessage: handleMessage,
		onStatusChange: handleStatusChange,
		reconnectDelay: 5000,
		maxReconnectAttempts: 20,
		pingInterval: 30000,
	});

	// Fonction helper pour envoyer des messages
	const sendMessage = useCallback((message: any) => {
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}, [socket]);

	// Demander le jeu initial quand la connexion est établie
	useEffect(() => {
		if (isConnected && socket) {
			sendMessage({ action: 'get_game' });
		}
	}, [isConnected, socket, sendMessage]);

	// Fonctions d'actions envoyées au serveur
	const newGame = () => {
		// Nettoyer le localStorage pour un nouveau jeu
		localStorage.removeItem('queens-game');
		sendMessage({ action: 'new_game' });
	};
	const makeMove = (row: number, col: number, newState: number) => sendMessage({ action: 'make_move', row, col, newState });
	const undoMove = () => sendMessage({ action: 'undo' });
	const hint = () => sendMessage({ action: 'hint' });
	const solution = () => sendMessage({ action: 'solution' });
	const updateParameters = (newParams: UpdateParameters) => {
		const { board_size, difficultyLevel, autoCross, view_tutorial } = newParams;
		sendMessage({ action: 'update_parameters', board_size, difficultyLevel, autoCross: autoCross ? 1 : 0, view_tutorial: view_tutorial || 0 });
	};

	return { game, newGame, makeMove, undoMove, hint, solution, updateParameters, notification: notifMessage };
};

export default SoloGame;
