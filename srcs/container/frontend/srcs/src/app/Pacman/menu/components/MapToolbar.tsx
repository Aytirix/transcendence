import React from 'react';

interface MapToolbarProps {
	onAddBorders: () => void;
	onSave: () => void;
	onCancel: () => void;
}

const MapToolbar: React.FC<MapToolbarProps> = ({ onAddBorders, onSave, onCancel }) => {
	return (
		<div className="toolbar">
			<div className="tool-group">
				<button onClick={onAddBorders}>Ajouter bordures</button>
				<button onClick={onSave}>Sauvegarder</button>
				<button onClick={onCancel}>Retour</button>
			</div>
		</div>
	);
};

export default MapToolbar;
