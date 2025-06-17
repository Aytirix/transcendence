import { useState, useCallback, useRef, useEffect } from 'react';
import { SoundManager } from '../../utils/SoundManager';
import { player } from '../../../types/pacmanTypes';

interface GameState {
	players: player[];
	pacmanLife: number;
	frightenedState: {
		active: boolean;
		remainingTime?: number;
	};
	launch: boolean;
}

export function useGameAudio(gameState: GameState, playerId?: number) {
	const [audioEnabled, setAudioEnabled] = useState(false);
	const previousScore = useRef<number>(0);
	const previousLife = useRef<number>(gameState.pacmanLife);
	const previousFrightened = useRef<boolean>(gameState.frightenedState.active);
	const gameStarted = useRef<boolean>(false);

	const handleFirstInteraction = useCallback(async () => {
		if (!audioEnabled) {
			console.log('🔊 Tentative d\'activation de l\'audio...');
			try {
				await SoundManager.getInstance().enableAudio();
				setAudioEnabled(true);
				console.log('✅ Audio activé avec succès !');
			} catch (error) {
				console.warn('⚠️ Échec de l\'activation audio', error);
			}
		}
	}, [audioEnabled]);

	// Surveiller les changements d'état du jeu pour déclencher les sons
	useEffect(() => {
		if (!audioEnabled) return;

		// Initialiser les refs au premier rendu
		const currentPlayer = gameState.players.find(p => p.id === playerId);
		const currentScore = currentPlayer?.score || 0;
		
		// Si c'est la première fois ou si le jeu vient de commencer
		if (!gameStarted.current && gameState.launch) {
			console.log('🎵 Début de partie - Son Start');
			SoundManager.getInstance().forcePlay('start');
			gameStarted.current = true;
			previousScore.current = currentScore;
			previousLife.current = gameState.pacmanLife;
			previousFrightened.current = gameState.frightenedState.active;
			return;
		}

		// Vérifier les changements de score (pastille mangée)
		if (currentScore > previousScore.current) {
			const scoreDifference = currentScore - previousScore.current;
			console.log(`📊 Score: ${previousScore.current} → ${currentScore} (diff: +${scoreDifference})`);
			
			if (scoreDifference >= 200 && gameState.frightenedState.active) {
				console.log('🎵 Fantôme mangé - Son GhostEat');
				SoundManager.getInstance().forcePlay('ghostEat');
			} else if (scoreDifference >= 50) {
				console.log('🎵 Power Pellet détecté via score');
			} else if (scoreDifference >= 5) {
				console.log('🎵 Pastille mangée - Son Chomp');
				SoundManager.getInstance().forcePlay('chomp');
			}
			
			previousScore.current = currentScore;
		}

		// Vérifier les changements de vie (mort)
		if (gameState.pacmanLife < previousLife.current) {
			console.log(`💀 Vies: ${previousLife.current} → ${gameState.pacmanLife}`);
			console.log('🎵 Vie perdue - Son Death');
			SoundManager.getInstance().forcePlay('death');
			previousLife.current = gameState.pacmanLife;
		}

		// Vérifier l'activation du mode frightened (power pellet)
		if (gameState.frightenedState.active && !previousFrightened.current) {
			console.log('⚡ Mode Frightened activé');
			console.log('🎵 Power Pellet - Son PowerUp');
			SoundManager.getInstance().forcePlay('powerUp');
			previousFrightened.current = true;
		} else if (!gameState.frightenedState.active && previousFrightened.current) {
			console.log('⚡ Mode Frightened désactivé');
			previousFrightened.current = false;
		}

	}, [audioEnabled, gameState.players, gameState.pacmanLife, gameState.frightenedState, playerId, gameState.launch]);

	return {
		audioEnabled,
		handleFirstInteraction
	};
}
