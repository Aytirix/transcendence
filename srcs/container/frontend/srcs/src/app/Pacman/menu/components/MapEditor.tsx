import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapEditorProps {
	onCreateMap?: () => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ onCreateMap }) => {
	const { t } = useLanguage();

	return (
		<div className="map-editor-placeholder">
			<h3>{t("pacman.menu.maps.editor")}</h3>
			{onCreateMap && (
				<button
					className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
					onClick={onCreateMap}
				>
					{t("pacman.menu.maps.create")}
				</button>
			)}
		</div>
	);
};

export default MapEditor;
