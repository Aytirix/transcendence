import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapToolbarProps {
	onAddBorders: () => void;
	onSave: () => void;
	onCancel: () => void;
}

const MapToolbar: React.FC<MapToolbarProps> = ({ onAddBorders, onSave, onCancel }) => {
	const { t } = useLanguage();
	return (
		<div className="toolbar">
			<div className="tool-group">
				<button onClick={onAddBorders}>{t("pacman.menu.maps.mapEditor.addBorders")}</button>
				<button onClick={onSave}>{t("pacman.menu.maps.mapEditor.save")}</button>
				<button onClick={onCancel}>{t("pacman.menu.maps.mapEditor.back")}</button>
			</div>
		</div>
	);
};

export default MapToolbar;
