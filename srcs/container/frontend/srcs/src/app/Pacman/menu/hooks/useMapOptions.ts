import { useMemo } from 'react';
import { state } from '../../../types/pacmanTypes';
import { useAllMaps } from './usePacmanMaps';

export interface MapOption {
	value: string;
	label: string;
	isCustom: boolean;
	isValid: boolean;
	disabled?: boolean;
	userId?: number;
	mapId?: number;
}

export function useMapOptions(state: state) {
	const { allMaps, loading, error } = useAllMaps(state);

	const mapOptions = useMemo(() => {
		// Default maps
		const DEFAULT_MAPS: MapOption[] = [
			{ mapId: -1, value: 'classic', label: 'Classique', isCustom: false, isValid: true },
		];
		// Separate user maps and public maps from allMaps
		const userMaps = allMaps
			.filter(map => map.user_id === state.player?.id)
			.map(map => ({
				value: map.id ? String(map.id) : map.name,
				label: map.name,
				isCustom: true,
				isValid: map.is_valid,
				userId: map.user_id,
				mapId: map.id,
			}))
			.filter(map => map.isValid)
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

		const publicMaps = allMaps
			.filter(map => map.user_id !== state.player?.id && map.is_public && map.is_valid)
			.map(map => ({
				value: map.id ? String(map.id) : map.name,
				label: `${map.name} (${map.id || 'Public'})`,
				isCustom: false,
				isValid: true,
				userId: map.user_id,
				mapId: map.id,
			}))
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

		// Combine all maps
		const MAPS: MapOption[] = [
			...DEFAULT_MAPS,
			...userMaps,
			...publicMaps,
		];

		return { MAPS };
	}, [allMaps, state.player?.id]);

	return { ...mapOptions, loading, error };
}
