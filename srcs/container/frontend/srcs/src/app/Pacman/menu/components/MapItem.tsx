import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';

interface MapItemProps {
	map: PacmanMap;
	onTogglePublic: (map: PacmanMap) => void;
	onEdit: (map: PacmanMap) => void;
	onDelete: (map: { id: number }) => void;
}

const MapItem: React.FC<MapItemProps> = ({ map, onTogglePublic, onEdit, onDelete }) => {
	return (
		<li className="map-item">
			<div className="map-info">
				<span className="map-name">{map.name}</span>
				<span className="switch-wrapper">
					<label className="switch">
						<input
							type="checkbox"
							checked={map.is_public}
							onChange={(e) => {
								e.stopPropagation();
								onTogglePublic(map);
							}}
							aria-checked={map.is_public}
							title={map.is_public ? 'Rendre privé' : 'Rendre public'}
							tabIndex={0}
						/>
						<span className="slider round"></span>
					</label>
					<span className="switch-label" style={{color: map.is_public ? "#ffd700" : "#aaa"}}>
						{map.is_public ? 'Public' : 'Privé'}
					</span>
				</span>
				<span className={`map-validity ${map.is_valid ? 'valid' : 'invalid'}`}>
					{map.is_valid ? 'Valide' : 'Invalide'}
				</span>
			</div>
			<div className="map-actions">
				{map.id !== undefined && (
					<>
						<button
							className="delete-btn"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(map as { id: number });
							}}
						>
							<span className="icon">🗑️</span>
							<span className="text">Supprimer</span>
						</button>
						<button
							className="edit-btn"
							onClick={(e) => {
								e.stopPropagation();
								if (map.id !== undefined) {
									onEdit(map);
								}
							}}
						>
							<span className="icon">✏️</span>
							<span className="text">Éditer</span>
						</button>
					</>
				)}
			</div>
		</li>
	);
};

export default MapItem;
