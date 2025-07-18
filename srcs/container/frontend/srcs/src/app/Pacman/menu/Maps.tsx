import React from 'react';
import '../../assets/styles/pacman/Maps.scss';
import { state, PacmanMap } from '../../types/pacmanTypes';
import { useMapsManagement } from './hooks/useMapsManagement';
import MapEditor from './components/MapEditor';
import MapsList from './components/MapsList';
import { useLanguage } from '../../../contexts/LanguageContext';

interface MapsProps {
	onCreateMap?: () => void;
	onEditMap?: (map: PacmanMap) => void;
	state: state;
}

const Maps: React.FC<MapsProps> = ({ onCreateMap, onEditMap, state }) => {
	const { deleteMap, toggleMapPublic } = useMapsManagement(state);
	const { t } = useLanguage();

	const handleEditMap = (map: PacmanMap) => {
		if (onEditMap) {
			onEditMap(map);
		}
	};

	return (
		<div className="maps">
			<h2 className="maps-title">{t("pacman.menu.maps.title")}</h2>
			<p className="maps-description">
				{t("pacman.menu.maps.descriptionEditor")}
			</p>
			
			<MapEditor onCreateMap={onCreateMap} />
			
			<MapsList
				maps={state.maps || []}
				onTogglePublic={toggleMapPublic}
				onEdit={handleEditMap}
				onDelete={deleteMap}
			/>
		</div>
	);
};

export default Maps;
