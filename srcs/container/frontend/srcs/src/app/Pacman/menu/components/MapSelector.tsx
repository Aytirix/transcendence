import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export interface MapOption {
	value: string;
	label: string;
	isCustom: boolean;
	isValid: boolean;
	disabled?: boolean;
}

interface MapSelectorProps {
	isOwner: boolean;
	currentMapValue: string;
	mapSearch: string;
	onMapSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMapChange: (mapValue: string) => void;
	filteredMaps: MapOption[];
	allMaps: MapOption[];
}

const MapSelector: React.FC<MapSelectorProps> = ({
	isOwner,
	currentMapValue,
	mapSearch,
	onMapSearchChange,
	onMapChange,
	filteredMaps,
	allMaps
}) => {
	const { t } = useLanguage();
	
	if (isOwner) {
		return (
			<>
				<input
					type="text"
					placeholder={t("pacman.menu.lobby.gameForm.mapPlaceholder")}
					value={mapSearch}
					onChange={onMapSearchChange}
					className="map-search"
				/>
				<select 
					className='map-select'
					value={currentMapValue}
					onChange={e => onMapChange(e.target.value)}
				>
					{filteredMaps.map(map => (
						<option key={map.value} value={map.value}>
							{map.isCustom ? '🗺️ ' : map.label === 'Classique' ? '' : '🛩️ '}
							{map.label}
						</option>
					))}
				</select>
			</>
		);
	}

	const currentMap = allMaps.find(m => m.value === currentMapValue);
	return (
		<span>
			Carte : {currentMap?.label || 'Classique'}
		</span>
	);
};

export default MapSelector;
