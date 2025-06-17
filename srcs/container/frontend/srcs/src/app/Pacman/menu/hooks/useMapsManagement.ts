import { useEffect, useCallback } from 'react';
import { state, PacmanMap } from '../../../types/pacmanTypes';

export function useMapsManagement(state: state) {
	const fetchMaps = useCallback(() => {
		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
			state.ws.send(
				JSON.stringify({
					action: 'getAllMapForUser',
				})
			);
		}
	}, [state.ws]);

	const deleteMap = useCallback((map: { id: number }) => {
		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
			state.ws.send(
				JSON.stringify({
					action: 'deleteMap',
					id: map.id,
				})
			);
		}
		setTimeout(fetchMaps, 200); // Recharger les cartes après la suppression
	}, [state.ws, fetchMaps]);

	const toggleMapPublic = useCallback((map: PacmanMap) => {
		if (state.ws && state.ws.readyState === WebSocket.OPEN && map.id !== undefined) {
			state.ws.send(
				JSON.stringify({
					action: 'insertOrUpdateMap',
					mapData: {
						...map,
						is_public: !map.is_public, // Inverser la visibilité
					},
				})
			);
		}
	}, [state.ws]);

	useEffect(() => {
		fetchMaps(); // Charger les cartes au montage du composant
	}, [fetchMaps]);

	return {
		fetchMaps,
		deleteMap,
		toggleMapPublic,
	};
}
