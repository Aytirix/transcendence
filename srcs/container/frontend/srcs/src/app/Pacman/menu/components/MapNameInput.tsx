import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapNameInputProps {
	mapName: string;
	onNameChange: (name: string) => void;
	disabled?: boolean;
	blurred?: boolean;
}

const MapNameInput: React.FC<MapNameInputProps> = ({ 
	mapName, 
	onNameChange, 
	disabled = false,
	blurred = false 
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		onNameChange(event.target.value);
	};
	const { t } = useLanguage();
	

	return (
		<div 
			className="map-name" 
			style={{ 
				filter: blurred ? 'blur(2px)' : undefined, 
				pointerEvents: blurred ? 'none' : undefined 
			}}
		>
			<label htmlFor="mapName">{t("pacman.menu.maps.mapEditor.mapName")}</label>
			<input
				type="text"
				id="mapName"
				value={mapName}
				onChange={handleChange}
				placeholder={t("pacman.menu.maps.mapEditor.mapNamePlaceholder")}
				disabled={disabled}
			/>
		</div>
	);
};

export default MapNameInput;
