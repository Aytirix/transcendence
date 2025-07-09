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
	const previousFrightened = useRef<boolean>(false);
	const gameStarted = useRef<boolean>(false);
	const lastEatingTime = useRef<number>(0);
	const soundManager = SoundManager.getInstance();

	const handleFirstInteraction = useCallback(async () => {
		if (!audioEnabled) {
			const success = await soundManager.enableAudio();
			setAudioEnabled(success);
		}
	}, [audioEnabled, soundManager]);

	// Initialize refs when game state changes
	useEffect(() => {
		const currentPlayer = gameState.players.find(p => p.id === playerId);
		const currentScore = currentPlayer?.score || 0;

		// Initialize on first render
		if (previousScore.current === 0 && currentScore > 0) {
			previousScore.current = currentScore;
			previousLife.current = gameState.pacmanLife;
			previousFrightened.current = gameState.frightenedState.active || false;
		}
	}, [gameState.players, playerId, gameState.pacmanLife, gameState.frightenedState]);

	// Handle game start
	useEffect(() => {
		if (!audioEnabled || gameStarted.current) return;

		if (gameState.launch && gameState.players.length > 0) {
			soundManager.playGameStart();
			gameStarted.current = true;
			
			// Start background siren after ready sound
			setTimeout(() => {
				soundManager.startSiren();
			}, 2000);
		}
	}, [audioEnabled, gameState.launch, gameState.players.length, soundManager]);

	
	// Handle score changes with better sound logic
	useEffect(() => {
		if (!audioEnabled || !gameStarted.current) return;

		const currentPlayer = gameState.players.find(p => p.id === playerId);
		const currentScore = currentPlayer?.score || 0;

		if (currentScore > previousScore.current) {
			const scoreDifference = currentScore - previousScore.current;
			const now = Date.now();


			if (scoreDifference >= 200) {
				soundManager.playGhostEaten();
			} else if (scoreDifference >= 50) {
				soundManager.playPowerPill();
				soundManager.playWaza(); // Play waza sound for power mode
			} else if (scoreDifference >= 10) {
				// Regular pellet - with throttling
				if (now - lastEatingTime.current > 100) { // Throttle eating sounds
					soundManager.playEating();
					lastEatingTime.current = now;
				}
			}

			// Check for extra life (typically at 10,000 points)
			if (Math.floor(currentScore / 10000) > Math.floor(previousScore.current / 10000)) {
				soundManager.playExtraLife();
			}

			previousScore.current = currentScore;
		}
	}, [audioEnabled, gameState.players, playerId, soundManager]);

	// Handle life changes (death)
	useEffect(() => {
		if (!audioEnabled || !gameStarted.current) return;

		if (gameState.pacmanLife < previousLife.current) {
			soundManager.playDeath();
			previousLife.current = gameState.pacmanLife;
			
			// Restart siren after death sound
			setTimeout(() => {
				if (gameState.pacmanLife > 0) {
					soundManager.startSiren();
				}
			}, 3000);
		}
	}, [audioEnabled, gameState.pacmanLife, soundManager, gameState]);

	// Handle frightened state changes
	useEffect(() => {
		if (!audioEnabled || !gameStarted.current) return;

		const currentFrightened = gameState.frightenedState.active || false;

		if (currentFrightened && !previousFrightened.current) {
			soundManager.stopSiren(); // Stop normal siren during frightened mode
			previousFrightened.current = true;
		} else if (!currentFrightened && previousFrightened.current) {
			soundManager.startSiren(); // Resume normal siren
			previousFrightened.current = false;
		}
	}, [audioEnabled, gameState.frightenedState, soundManager]);

	// Reset when game ends
	useEffect(() => {
		if (!gameState.launch && gameStarted.current) {
			gameStarted.current = false;
			soundManager.stopAll();
		}
	}, [gameState.launch, soundManager]);

	return {
		audioEnabled,
		handleFirstInteraction,
		soundManager
	};
}
