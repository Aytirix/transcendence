import React from 'react';

interface MapPreviewProps {
	grid: string[];
}

const MapPreview: React.FC<MapPreviewProps> = ({ grid }) => {
	return (
		<div className='right-panel'>
			<div className="map-preview">
				<h3>Aperçu de la carte</h3>
				<pre className="map-code">
					{grid.join('\n')}
				</pre>
			</div>
		</div>
	);
};

export default MapPreview;
