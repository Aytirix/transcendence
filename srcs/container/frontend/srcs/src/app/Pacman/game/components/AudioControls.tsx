import React from 'react';
import { player, state } from '../../../types/pacmanTypes';

interface AudioControlsProps {
	audioEnabled: boolean;
	players: player[];
	state: state;
}

const AudioControls: React.FC<AudioControlsProps> = ({ audioEnabled, players, state }) => {
	return (
		<div className="audio-controls">
			{!audioEnabled && (
				<div className="audio-warning">
					<span>🔇 Click anywhere to enable audio</span>
				</div>
			)}
			{audioEnabled && (
				<div className="audio-status">
					<span>🔊 Audio enabled</span>
				</div>
			)}
		</div>
	);
};

export default AudioControls;
