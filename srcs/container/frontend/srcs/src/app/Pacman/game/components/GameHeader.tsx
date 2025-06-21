import React from 'react';

interface GameHeaderProps {
	audioEnabled: boolean;
	onFirstInteraction: () => Promise<void>;
}

const GameHeader: React.FC<GameHeaderProps> = () => {
	return (
		<div className="header">
			<h3 className="title">PAC-MAN</h3>
		</div>
	);
};

export default GameHeader;
