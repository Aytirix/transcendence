import { useMemo } from 'react';
import { state } from '../../../types/pacmanTypes';
import { useAllMaps } from './usePacmanMaps';

export interface MapOption {
	value: string;
	label: string;
	isCustom: boolean;
	isValid: boolean;
	disabled?: boolean;
}

export function useMapOptions(state: state) {
	const { allMaps, loading, error } = useAllMaps(state);

	const mapOptions = useMemo(() => {
		// Default maps
		const DEFAULT_MAPS: MapOption[] = [
			{ value: 'classic', label: 'Classique', isCustom: false, isValid: true },
		];

		// Separate user maps and public maps from allMaps
		const userMaps = allMaps
			.filter(map => map.user_id === state.player?.id)
			.map(map => ({
				value: map.id ? String(map.id) : map.name,
				label: map.name,
				isCustom: true,
				isValid: map.is_valid,
			}))
			.filter(map => map.isValid)
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

		const publicMaps = allMaps
			.filter(map => map.user_id !== state.player?.id && map.is_public && map.is_valid)
			.map(map => ({
				value: map.id ? String(map.id) : map.name,
				label: `${map.name} (${map.username || 'Public'})`,
				isCustom: false,
				isValid: true,
			}))
			.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

		// Combine all maps
		const MAPS: MapOption[] = [
			...DEFAULT_MAPS,
			...(userMaps.length > 0 ? [{ value: '', label: '--- Mes cartes ---', disabled: true, isCustom: false, isValid: true }] : []),
			...userMaps,
			...(publicMaps.length > 0 ? [{ value: '', label: '--- Cartes publiques ---', disabled: true, isCustom: false, isValid: true }] : []),
			...publicMaps,
		];

		return { MAPS, userMaps, publicMaps };
	}, [allMaps, state.player?.id]);

	return { ...mapOptions, loading, error };
}
