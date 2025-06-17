import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';
import MapItem from './MapItem';

interface MapsListProps {
	maps: PacmanMap[];
	onTogglePublic: (map: PacmanMap) => void;
	onEdit: (map: PacmanMap) => void;
	onDelete: (map: { id: number }) => void;
}

const MapsList: React.FC<MapsListProps> = ({ maps, onTogglePublic, onEdit, onDelete }) => {
	if (!maps || maps.length === 0) {
		return <p>Aucune carte disponible</p>;
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
