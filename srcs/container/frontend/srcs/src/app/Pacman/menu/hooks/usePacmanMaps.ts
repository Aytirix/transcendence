import { useEffect, useState } from 'react';
import { state, PacmanMap } from '../../../types/pacmanTypes';

// Hook pour récupérer toutes les maps publiques via WebSocket
export function useFetchPublicMaps(state: state) {
	const [publicMaps, setPublicMaps] = useState<PacmanMap[]>([]);
	const [loading, setLoading] = useState(false);
	const [error] = useState<null | string>(null);

	// Écouter les changements de state.publicMaps (mis à jour par Init.tsx)
	// La requête searchMap est maintenant gérée automatiquement dans Init.tsx
	useEffect(() => {
		if (state.publicMaps) {
			setPublicMaps(state.publicMaps);
			setLoading(false);
		}
	}, [state.publicMaps]);

	return { publicMaps, loading, error };
}

// Hook pour récupérer toutes les maps (user + publiques)
export function useAllMaps(state: state) {
	const { publicMaps, loading: loadingPublic, error: errorPublic } = useFetchPublicMaps(state);
	
	// Vérifier si l'utilisateur est dans une CurrentRoom
	const currentRoom = state.rooms?.waiting?.find(r =>
		r.players?.some(p => p.id === state.player?.id)
	);
	
	// Si on est dans une room et qu'on a des résultats de searchMap, utiliser uniquement ces résultats
	// car searchMap retourne déjà toutes les maps valides (publiques + user maps)
	if (currentRoom && publicMaps.length > 0) {
		return { allMaps: publicMaps, loading: loadingPublic, error: errorPublic };
	}
	
	// Sinon, utiliser les maps utilisateur de state.maps
	const userMaps = state.maps || [];
	const allMaps = [
		...userMaps,
		...publicMaps.filter(
			(pubMap: PacmanMap) => !userMaps.some((userMap: PacmanMap) => userMap.id === pubMap.id)
		),
	];
	return { allMaps, loading: loadingPublic, error: errorPublic };
}
