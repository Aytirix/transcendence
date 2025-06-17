import React from 'react';
import { SoundManager } from '../../utils/SoundManager';
import { player, state } from '../../../types/pacmanTypes';

interface AudioControlsProps {
	audioEnabled: boolean;
	players: player[];
	state: state;
}

const AudioControls: React.FC<AudioControlsProps> = ({ audioEnabled, players, state }) => {
	if (!audioEnabled) {
		return (
			<div className="audio-notice" style={{ color: 'yellow', fontSize: '14px' }}>
				Cliquez pour activer le son
			</div>
		);
	}

	return (
		<div className="sound-test-buttons" style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
			<button 
				style={{ padding: '2px 6px', fontSize: '12px' }} 
				onClick={() => SoundManager.getInstance().play('start')}
			>
				🎵 Start
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '12px' }} 
				onClick={() => SoundManager.getInstance().forcePlay('chomp')}
			>
				🎵 Chomp
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '12px' }} 
				onClick={() => SoundManager.getInstance().forcePlay('death')}
			>
				🎵 Death
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '12px' }} 
				onClick={() => SoundManager.getInstance().forcePlay('ghostEat')}
			>
				🎵 Ghost
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '12px' }} 
				onClick={() => SoundManager.getInstance().forcePlay('powerUp')}
			>
				🎵 Power
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#666' }} 
				onClick={() => {
					console.log('🔊 Audio enabled:', SoundManager.getInstance().isAudioEnabled());
				}}
			>
				🔧 Test Audio
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#777' }} 
				onClick={async () => {
					await SoundManager.getInstance().enableAudio();
					console.log(`🔧 Audio activé`);
				}}
			>
				🔧 Force Audio
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#444' }} 
				onClick={() => {
					console.clear();
					console.log('🧹 Console nettoyée');
				}}
			>
				🧹 Clear
			</button>
			<button 
				style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#333' }} 
				onClick={() => {
					const currentPlayer = players.find(p => p.id === state.player?.id);
					console.log('🔍 État actuel du jeu:', {
						score: currentPlayer?.score || 0,
						life: state.game.pacmanLife,
						frightened: state.game.frightenedState.active,
						launch: state.game.launch
					});
				}}
			>
				🔍 Debug
			</button>
		</div>
	);
};

export default AudioControls;
