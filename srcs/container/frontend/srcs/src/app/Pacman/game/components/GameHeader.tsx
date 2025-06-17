import React from 'react';
import { SoundManager } from '../../utils/SoundManager';

interface GameHeaderProps {
	audioEnabled: boolean;
	onFirstInteraction: () => Promise<void>;
}

const GameHeader: React.FC<GameHeaderProps> = ({ audioEnabled, onFirstInteraction }) => {
	return (
		<div className="header">
			<h3 className="title">PAC-MAN</h3>
			{!audioEnabled && (
				<div className="audio-notice" style={{ color: 'yellow', fontSize: '14px' }}>
					Cliquez pour activer le son
				</div>
			)}
			{audioEnabled && (
				<div className="sound-test-buttons" style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
					<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().play('start')}>🎵 Start</button>
					<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().play('chomp')}>🎵 Chomp</button>
					<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().play('death')}>🎵 Death</button>
					<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().play('ghostEat')}>🎵 Ghost</button>
					<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().play('powerUp')}>🎵 Power</button>
					<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#777' }} onClick={onFirstInteraction}>🔧 Force Audio</button>
					<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#444' }} onClick={() => {
						console.clear();
						console.log('🧹 Console nettoyée');
					}}>🧹 Clear</button>
				</div>
			)}
		</div>
	);
};

export default GameHeader;
