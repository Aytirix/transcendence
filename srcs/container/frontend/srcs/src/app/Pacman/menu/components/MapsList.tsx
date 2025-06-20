import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';
import MapItem from './MapItem';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapsListProps {
	maps: PacmanMap[];
	onTogglePublic: (map: PacmanMap) => void;
	onEdit: (map: PacmanMap) => void;
	onDelete: (map: { id: number }) => void;
}

const MapsList: React.FC<MapsListProps> = ({ maps, onTogglePublic, onEdit, onDelete }) => {
	const { t } = useLanguage();
	if (!maps || maps.length === 0) {
		return <p>{t("pacman.menu.maps.noMapsFound")}</p>;
	}
	return (
		<div className="maps-list">
			<ul>
				{maps.map((map) => (
					<MapItem
						key={map.id || Math.random()}
						map={map}
						onTogglePublic={onTogglePublic}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</ul>
		</div>
	);
};

export default MapsList;
