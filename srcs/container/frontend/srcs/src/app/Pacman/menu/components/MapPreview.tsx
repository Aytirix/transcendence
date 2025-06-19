import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface MapPreviewProps {
	grid: string[];
}

const MapPreview: React.FC<MapPreviewProps> = ({ grid }) => {
	const { t } = useLanguage();
	
	return (
		<div className='right-panel'>
			<div className="map-preview">
				<h3>{t("pacman.menu.maps.mapEditor.mapPreview")}</h3>
				<pre className="map-code">
					{grid.join('\n')}
				</pre>
			</div>
		</div>
	);
};

export default MapPreview;
