import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';

interface MapNameModalProps {
	isOpen: boolean;
	tempMapName: string;
	setTempMapName: (name: string) => void;
	existingMaps?: PacmanMap[];
	onSubmit: (name: string) => void;
}

const MapNameModal: React.FC<MapNameModalProps> = ({
	isOpen,
	tempMapName,
	setTempMapName,
	existingMaps = [],
	onSubmit
}) => {
	if (!isOpen) return null;

	const nameExists = existingMaps.some(map => map.name === tempMapName.trim());
	const isValidName = tempMapName.trim() && !nameExists;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const name = tempMapName.trim();
		if (isValidName) {
			onSubmit(name);
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h3>Nom de la carte</h3>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={tempMapName}
						onChange={e => setTempMapName(e.target.value)}
						placeholder="Entrez le nom de la carte"
						autoFocus
					/>
					{nameExists && (
						<div className='error_name' style={{ color: 'red', fontSize: 15, marginBottom: 8 }}>
							Ce nom existe déjà. Choisissez un autre nom.
						</div>
					)}
					<br />
					<button type="submit" disabled={!isValidName}>
						Valider
					</button>
				</form>
			</div>
		</div>
	);
};

export default MapNameModal;
