import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapConsoleProps {
	maps?: PacmanMap[];
	mapId?: number;
}

const MapConsole: React.FC<MapConsoleProps> = ({ maps = [], mapId }) => {
	const mapWithErrors = maps
		.filter(map => map.id === mapId && !map.is_valid && map.errors && map.errors.length > 0);
	const currentMap = maps.find(map => map.id === mapId);
	const { t } = useLanguage();
	
	return (
		<div className="map-console">
			<h3>{t("pacman.menu.maps.mapEditor.console")}</h3>
			<pre className="console-output">
				{mapWithErrors.length > 0 ? (
					mapWithErrors.map((map, index) => (
						<div key={index} className="console-error">
							<div className="error-header"> {t("pacman.menu.maps.mapEditor.errors")} "{map.name }"</div>
							<div className="error-list">
								{map.errors && map.errors.map((error, errorIndex) => (
									<div key={errorIndex} className="error-item">⚠ {error}</div>
								))}
							</div>
						</div>
					))
				) : currentMap ? (
					<div className="console-success">
						<div className="error-header"> "{currentMap.name }"</div>
						<div className="error-list">
							<div className="error-item">{t("pacman.menu.maps.mapEditor.noErrors")}</div>
						</div>
					</div>
				) : null}
			</pre>
		</div>
	);
};

export default MapConsole;
