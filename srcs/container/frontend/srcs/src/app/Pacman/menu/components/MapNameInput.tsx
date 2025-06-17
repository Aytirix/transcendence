import React from 'react';

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

	return (
		<div 
			className="map-name" 
			style={{ 
				filter: blurred ? 'blur(2px)' : undefined, 
				pointerEvents: blurred ? 'none' : undefined 
			}}
		>
			<label htmlFor="mapName">Nom de la carte:</label>
			<input
				type="text"
				id="mapName"
				value={mapName}
				onChange={handleChange}
				placeholder="Nom de la carte"
				disabled={disabled}
			/>
		</div>
	);
};

export default MapNameInput;
