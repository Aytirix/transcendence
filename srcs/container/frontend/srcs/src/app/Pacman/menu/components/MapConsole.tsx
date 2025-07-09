import React, { useState, useEffect } from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapConsoleProps {
	maps?: PacmanMap[];
	mapId?: number;
}

const MapConsole: React.FC<MapConsoleProps> = ({ maps = [], mapId }) => {
	const [lastValidationResult, setLastValidationResult] = useState<{
		hasErrors: boolean;
		mapName: string;
		errors: string[];
	} | null>(null);
	
	const mapWithErrors = maps
		.filter(map => map.id === mapId && !map.is_valid && map.errors && map.errors.length > 0);
	const currentMap = maps.find(map => map.id === mapId);
	const { t } = useLanguage();

	// Sauvegarder le dernier résultat de validation quand il y a des erreurs ou un succès
	useEffect(() => {
		if (currentMap) {
			if (mapWithErrors.length > 0) {
				// Il y a des erreurs
				setLastValidationResult({
					hasErrors: true,
					mapName: currentMap.name,
					errors: currentMap.errors || []
				});
			} else if (currentMap.is_valid) {
				// Pas d'erreurs, carte valide
				setLastValidationResult({
					hasErrors: false,
					mapName: currentMap.name,
					errors: []
				});
			}
			// Si la carte n'est ni valide ni invalide (en cours de modification), on garde le dernier résultat
		}
	}, [mapWithErrors, currentMap]);

	// Afficher le dernier résultat de validation connu
	const displayResult = lastValidationResult || (currentMap ? {
		hasErrors: mapWithErrors.length > 0,
		mapName: currentMap.name,
		errors: currentMap.errors || []
	} : null);
	
	return (
		<div className="map-console">
			<h3>{t("pacman.menu.maps.mapEditor.console")}</h3>
			<pre className="console-output">
				{displayResult ? (
					displayResult.hasErrors ? (
						<div className="console-error">
							<div className="error-header"> {t("pacman.menu.maps.mapEditor.errors")} "{displayResult.mapName}"</div>
							<div className="error-list">
								{displayResult.errors.map((error, errorIndex) => (
									<div key={errorIndex} className="error-item">⚠ {error}</div>
								))}
							</div>
						</div>
					) : (
						<div className="console-success">
							<div className="error-header"> "{displayResult.mapName}"</div>
							<div className="error-list">
								<div className="error-item">{t("pacman.menu.maps.mapEditor.noErrors")}</div>
							</div>
						</div>
					)
				) : (
					<div className="console-info">
						<div className="error-header">{t("pacman.menu.maps.mapEditor.console")}</div>
						<div className="error-list">
							<div className="error-item">En attente de validation...</div>
						</div>
					</div>
				)}
			</pre>
		</div>
	);
};

export default MapConsole;
