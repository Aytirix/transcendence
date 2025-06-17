import React from 'react';

interface MapEditorProps {
	onCreateMap?: () => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ onCreateMap }) => {
	return (
		<div className="map-editor-placeholder">
			<h3>Éditeur de carte</h3>
			{onCreateMap && (
				<button
					className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
					onClick={onCreateMap}
				>
					Créer une nouvelle carte
				</button>
			)}
		</div>
	);
};

export default MapEditor;
