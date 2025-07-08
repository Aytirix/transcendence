import React from 'react';
import { player, state } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface AudioControlsProps {
	audioEnabled: boolean;
	players: player[];
	state: state;
}

const AudioControls: React.FC<AudioControlsProps> = ({ audioEnabled }) => {
	const { t } = useLanguage();
	
	return (
		<div className="audio-controls">
			{!audioEnabled && (
				<div className="audio-warning">
					<span>🔇 {t('pacman.game.clickToEnableAudio')}</span>
				</div>
			)}
			{audioEnabled && (
				<div className="audio-status">
					<span>🔊 {t('pacman.game.audioEnabled')}</span>
				</div>
			)}
		</div>
	);
};

export default AudioControls;
