import { useEffect, useRef } from 'react';
import { SoundManager } from '../../utils/SoundManager';
import { player, state } from '../../../types/pacmanTypes';

interface UseSoundEffectsProps {
	audioEnabled: boolean;
	players: player[];
	state: state;
}

export const useSoundEffects = ({ audioEnabled, players, state }: UseSoundEffectsProps) => {
	const previousScore = useRef<number>(0);
	const previousLife = useRef<number>(state.game.pacmanLife);
	const previousFrightened = useRef<boolean>(state.game.frightenedState.active);
	const gameStarted = useRef<boolean>(false);

	useEffect(() => {
		if (!audioEnabled) return;

		const currentPlayer = players.find(p => p.id === state.player?.id);
		const currentScore = currentPlayer?.score || 0;
		
		// Si c'est la première fois ou si le jeu vient de commencer
		if (!gameStarted.current && state.game.launch) {
			console.log('🎵 Début de partie - Son Start');
			SoundManager.getInstance().forcePlay('start');
			gameStarted.current = true;
			previousScore.current = currentScore;
			previousLife.current = state.game.pacmanLife;
			previousFrightened.current = state.game.frightenedState.active;
			return;
		}

		// Vérifier les changements de score (pastille mangée)
		if (currentScore > previousScore.current) {
			const scoreDifference = currentScore - previousScore.current;
			console.log(`📊 Score: ${previousScore.current} → ${currentScore} (diff: +${scoreDifference})`);
			
			// Si le score augmente beaucoup, c'est probablement un fantôme
			if (scoreDifference >= 200 && state.game.frightenedState.active) {
				console.log('🎵 Fantôme mangé - Son GhostEat');
				SoundManager.getInstance().forcePlay('ghostEat');
			} else if (scoreDifference >= 5) { // Pastille normale
				console.log('🎵 Pastille mangée - Son Chomp');
				SoundManager.getInstance().forcePlay('chomp');
			}
			
			previousScore.current = currentScore;
		}

		// Vérifier les changements de vie (mort)
		if (state.game.pacmanLife < previousLife.current) {
			console.log(`💀 Vies: ${previousLife.current} → ${state.game.pacmanLife}`);
			console.log('🎵 Vie perdue - Son Death');
			SoundManager.getInstance().forcePlay('death');
			previousLife.current = state.game.pacmanLife;
		}

		// Vérifier l'activation du mode frightened (power pellet)
		if (state.game.frightenedState.active && !previousFrightened.current) {
			console.log('⚡ Mode Frightened activé');
			console.log('🎵 Power Pellet - Son PowerUp');
			SoundManager.getInstance().forcePlay('powerUp');
			previousFrightened.current = true;
		} else if (!state.game.frightenedState.active && previousFrightened.current) {
			console.log('⚡ Mode Frightened désactivé');
			previousFrightened.current = false;
		}

	}, [audioEnabled, players, state.game.pacmanLife, state.game.frightenedState, state.player?.id, state.game.launch]);
};
