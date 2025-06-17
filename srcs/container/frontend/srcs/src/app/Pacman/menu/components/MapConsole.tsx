import React from 'react';
import { PacmanMap } from '../../../types/pacmanTypes';

interface MapConsoleProps {
	maps?: PacmanMap[];
	mapId?: number;
}

const MapConsole: React.FC<MapConsoleProps> = ({ maps = [], mapId }) => {
	const mapWithErrors = maps
		.filter(map => map.id === mapId && !map.is_valid && map.errors && map.errors.length > 0);

	return (
		<div className="map-console">
			<h3>Console</h3>
			<pre className="console-output">
				{mapWithErrors.map((map, index) => (
					<div key={index} className="console-error">
						<div className="error-header">❌ Erreurs dans la carte "{map.name}":</div>
						<div className="error-list">
							{map.errors && map.errors.map((error, errorIndex) => (
								<div key={errorIndex} className="error-item">• {error}</div>
							))}
						</div>
					</div>
				))}
			</pre>
		</div>
	);
};

export default MapConsole;
