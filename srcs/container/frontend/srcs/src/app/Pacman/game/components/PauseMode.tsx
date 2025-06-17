import React from 'react';

interface PauseModeProps {
	isPaused: boolean;
	message?: string;
}

const PauseMode: React.FC<PauseModeProps> = ({ isPaused, message }) => {
	return (
		<div className={`pause-mode ${isPaused ? 'active' : ''}`}>
			{isPaused && (
				<div className="pause-message" style={{ whiteSpace: 'pre-line' }}>
					{message || 'Jeu en pause'}
				</div>
			)}
		</div>
	);
};

export default PauseMode;
