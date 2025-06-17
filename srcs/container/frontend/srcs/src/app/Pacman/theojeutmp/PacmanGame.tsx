// src/components/pacman/PacmanGame.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PacmanGame.scss';
import { state } from '../../types/pacmanTypes';
import portalImg from '../../assets/img/pacman/portal.gif';
import { SoundManager } from '../utils/SoundManager.tsx';

// Import des GIFs de fantômes
import ghostBRightGif from '../../assets/img/pacman/ghosts/B-right.gif';
import ghostBLeftGif from '../../assets/img/pacman/ghosts/B-left.gif';
import ghostBUpGif from '../../assets/img/pacman/ghosts/B-up.gif';
import ghostBDownGif from '../../assets/img/pacman/ghosts/B-down.gif';

import ghostPRightGif from '../../assets/img/pacman/ghosts/P-right.gif';
import ghostPLeftGif from '../../assets/img/pacman/ghosts/P-left.gif';
import ghostPUpGif from '../../assets/img/pacman/ghosts/P-up.gif';
import ghostPDownGif from '../../assets/img/pacman/ghosts/P-down.gif';

import ghostIRightGif from '../../assets/img/pacman/ghosts/I-right.gif';
import ghostILeftGif from '../../assets/img/pacman/ghosts/I-left.gif';
import ghostIUpGif from '../../assets/img/pacman/ghosts/I-up.gif';
import ghostIDownGif from '../../assets/img/pacman/ghosts/I-down.gif';

import ghostCRightGif from '../../assets/img/pacman/ghosts/C-right.gif';
import ghostCLeftGif from '../../assets/img/pacman/ghosts/C-left.gif';
import ghostCUpGif from '../../assets/img/pacman/ghosts/C-up.gif';
import ghostCDownGif from '../../assets/img/pacman/ghosts/C-down.gif';

// Import des GIFs/PNGs spéciaux
import frightenedGif from '../../assets/img/pacman/ghosts/frightened.gif';
import blinkingGif from '../../assets/img/pacman/ghosts/blinking.gif';
import eyesRightPng from '../../assets/img/pacman/ghosts/eyes-right.png';
import eyesLeftPng from '../../assets/img/pacman/ghosts/eyes-left.png';
import eyesUpPng from '../../assets/img/pacman/ghosts/eyes-up.png';
import eyesDownPng from '../../assets/img/pacman/ghosts/eyes-down.png';

// Imports de Pacman
import pacmanRightGif from '../../assets/img/pacman/pacman-right.gif';
import pacmanLeftGif from '../../assets/img/pacman/pacman-left.gif';
import pacmanUpGif from '../../assets/img/pacman/pacman-up.gif';
import pacmanDownGif from '../../assets/img/pacman/pacman-down.gif';
import pacmanDeathGif from '../../assets/img/pacman/pacman-death.gif';
import pacmanPng from '../../assets/img/pacman/pacman.png';

// Créer un mapping d'images pour faciliter l'accès
const ghostImages = {
	'B': {
		'right': ghostBRightGif,
		'left': ghostBLeftGif,
		'up': ghostBUpGif,
		'down': ghostBDownGif
	},
	'Y': {
		'right': ghostPRightGif,
		'left': ghostPLeftGif,
		'up': ghostPUpGif,
		'down': ghostPDownGif
	},
	'I': {
		'right': ghostIRightGif,
		'left': ghostILeftGif,
		'up': ghostIUpGif,
		'down': ghostIDownGif
	},
	'C': {
		'right': ghostCRightGif,
		'left': ghostCLeftGif,
		'up': ghostCUpGif,
		'down': ghostCDownGif
	},
	'eyes': {
		'right': eyesRightPng,
		'left': eyesLeftPng,
		'up': eyesUpPng,
		'down': eyesDownPng
	},
	'frightened': frightenedGif,
	'blinking': blinkingGif
};

// Mapping pour les images de Pacman (similaire à ghostImages)
const pacmanImages = {
	'right': pacmanRightGif,
	'left': pacmanLeftGif,
	'up': pacmanUpGif,
	'down': pacmanDownGif,
	'death': pacmanDeathGif,
	'default': pacmanPng
};

const CONTAINER_SIZE_WIDTH = 709; // Doit correspondre à la taille CSS
const CONTAINER_SIZE_HEIGHT = 761; // Doit correspondre à la taille CSS

export interface Player {
	id: number;
	username: string;     // j'ai renommé en "username" pour coller à l'exemple d'Engine.ts
	character: string;    // 'P' pour Pac-Man, 'I','Y','B','P','C' pour fantômes, etc.
	position: {
		x: number;        // correspond désormais au centre en pixels
		y: number;
	};
	score: number;
	direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
	returnToSpawn?: boolean; // true si le joueur doit retourner à son spawn
	isFrightened?: boolean; // true si le fantôme est effrayé
	//remainingTime?: number; // Temps restant pour l'état effrayé
	isDying?: boolean; // true si Pacman est en train de mourir
}

interface PacmanGameProps {
	state: state;
}

// Function to determine the type of wall tile based on its neighbors
const getWallType = (rowIndex: number, colIndex: number, grid: string[]): string => {
	// Check the 4 adjacent neighbors (top, right, bottom, left)
	const hasTopWall = rowIndex > 0 && grid[rowIndex - 1][colIndex] === '#';
	const hasRightWall = colIndex < grid[rowIndex].length - 1 && grid[rowIndex][colIndex + 1] === '#';
	const hasBottomWall = rowIndex < grid.length - 1 && grid[rowIndex + 1][colIndex] === '#';
	const hasLeftWall = colIndex > 0 && grid[rowIndex][colIndex - 1] === '#';

	// Count the number of wall neighbors
	const wallCount = [hasTopWall, hasRightWall, hasBottomWall, hasLeftWall].filter(Boolean).length;

	// Determine wall type
	if (wallCount === 1) {
		// End pieces
		if (hasTopWall) return 'wall-end-bottom';
		if (hasRightWall) return 'wall-end-left';
		if (hasBottomWall) return 'wall-end-top';
		if (hasLeftWall) return 'wall-end-right';
	} else if (wallCount === 2) {
		// Corner or straight
		if (hasTopWall && hasRightWall) return 'wall-corner-top-right';
		if (hasRightWall && hasBottomWall) return 'wall-corner-bottom-right';
		if (hasBottomWall && hasLeftWall) return 'wall-corner-bottom-left';
		if (hasLeftWall && hasTopWall) return 'wall-corner-top-left';
		if (hasTopWall && hasBottomWall) return 'wall-straight-vertical';
		if (hasLeftWall && hasRightWall) return 'wall-straight-horizontal';
	} else if (wallCount === 3) {
		// T-junctions
		if (!hasTopWall) return 'wall-t-top';
		if (!hasRightWall) return 'wall-t-right';
		if (!hasBottomWall) return 'wall-t-bottom';
		if (!hasLeftWall) return 'wall-t-left';
	} else if (wallCount === 4) {
		return 'wall-cross';
	}

	return 'wall-single'; // Isolated wall piece
};

const PauseMode = ({ state }: { state: state }) => {
	const { paused } = state.game.paused;

	return (
		<div className={`pause-mode ${paused ? 'active' : ''}`}>
			{paused && <div className="pause-message" style={{ whiteSpace: 'pre-line' }}>{state.game.paused.message}</div>}
		</div>
	);
}

const PacmanGame: React.FC<PacmanGameProps> = ({ state }) => {
	const { grid, players, tileSize } = state.game;
	const [audioEnabled, setAudioEnabled] = useState(false);

	// Refs pour mémoriser l'état précédent du jeu
	const previousScore = useRef<number>(0);
	const previousLife = useRef<number>(state.game.pacmanLife);
	const previousFrightened = useRef<boolean>(state.game.frightenedState.active);
	const gameStarted = useRef<boolean>(false);

	const numRows = grid.length;
	const numCols = grid[0].length;
	const mapWidth = numCols * tileSize;
	const mapHeight = numRows * tileSize;
	const scale = Math.min(
		CONTAINER_SIZE_WIDTH / mapWidth,
		CONTAINER_SIZE_HEIGHT / mapHeight
	);

	const offsetX = (CONTAINER_SIZE_WIDTH - mapWidth * scale) / 2;
	const offsetY = (CONTAINER_SIZE_HEIGHT - mapHeight * scale) / 2;

	// Fonction pour activer l'audio au premier clic/interaction
	const handleFirstInteraction = useCallback(async () => {
		if (!audioEnabled) {
			console.log('🔊 Tentative d\'activation de l\'audio...');
			const success = await SoundManager.getInstance().forceEnableAudio();
			if (success) {
				setAudioEnabled(true);
				console.log('✅ Audio activé avec succès !');
			} else {
				console.warn('⚠️ Échec de l\'activation audio');
			}
		}
	}, [audioEnabled]);

	const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
		if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;

		// Activer l'audio au premier appui de touche
		await handleFirstInteraction();

		const keyActions: Record<string, string> = {
			'ArrowUp': 'UP',
			'ArrowDown': 'DOWN',
			'ArrowLeft': 'LEFT',
			'ArrowRight': 'RIGHT'
		};

		const direction = keyActions[event.key];
		if (direction) {
			state.ws.send(JSON.stringify({
				action: 'playerMove',
				direction: direction
			}));
			event.preventDefault();
		}
	}, [state.ws, handleFirstInteraction]);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	// Surveiller les changements d'état du jeu pour déclencher les sons
	useEffect(() => {
		if (!audioEnabled) return;

		// Initialiser les refs au premier rendu
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
			return; // Ne pas vérifier d'autres changements lors de l'initialisation
		}

		// Vérifier les changements de score (pastille mangée) - logique améliorée
		if (currentScore > previousScore.current) {
			const scoreDifference = currentScore - previousScore.current;
			console.log(`📊 Score: ${previousScore.current} → ${currentScore} (diff: +${scoreDifference})`);
			
			// Si le score augmente beaucoup (ex: 200+ points), c'est probablement un fantôme
			if (scoreDifference >= 200 && state.game.frightenedState.active) {
				console.log('🎵 Fantôme mangé - Son GhostEat');
				SoundManager.getInstance().forcePlay('ghostEat');
			} else if (scoreDifference >= 50) { // Power pellet (généralement 50 points)
				console.log('🎵 Power Pellet - Son PowerUp (via score)');
				// Ne pas jouer le son ici car il sera joué par la détection frightenedState
			} else if (scoreDifference >= 5) { // Pastille normale (généralement 10 points)
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

	// Attribue une classe CSS à chaque caractère
	const getTileClass = (char: string, rowIndex: number, colIndex: number) => {
		switch (char) {
			case '#': return `tile wall ${getWallType(rowIndex, colIndex, grid)}`;
			case '.': return 'tile pellet';
			case '-': return 'tile door';
			case 'o': return 'tile power-pellet';
			case 'T': return 'tile tunnel';
			case ' ': return 'tile empty';
			default: return 'tile empty';
		}
	};


	return (
		<div className="PacmanGame" onClick={handleFirstInteraction}>
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
						<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().forcePlay('chomp')}>🎵 Chomp</button>
						<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().forcePlay('death')}>🎵 Death</button>
						<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().forcePlay('ghostEat')}>🎵 Ghost</button>
						<button style={{ padding: '2px 6px', fontSize: '12px' }} onClick={() => SoundManager.getInstance().forcePlay('powerUp')}>🎵 Power</button>
						<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#666' }} onClick={() => {
							SoundManager.getInstance().testSounds();
							console.log('🔊 Audio enabled:', SoundManager.getInstance().isAudioEnabled());
						}}>🔧 Test Audio</button>
						<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#555' }} onClick={() => {
							SoundManager.getInstance().diagnoseAudio();
						}}>🔍 Diagnostic</button>
						<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#777' }} onClick={async () => {
							const success = await SoundManager.getInstance().forceEnableAudio();
							console.log(`🔧 Forçage audio: ${success ? 'SUCCÈS' : 'ÉCHEC'}`);
						}}>🔧 Force Audio</button>
						<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#444' }} onClick={() => {
							console.clear();
							console.log('🧹 Console nettoyée');
						}}>🧹 Clear</button>
						<button style={{ padding: '2px 6px', fontSize: '11px', backgroundColor: '#333' }} onClick={() => {
							const currentPlayer = players.find(p => p.id === state.player?.id);
							console.log('🔍 État actuel du jeu:', {
								score: currentPlayer?.score || 0,
								life: state.game.pacmanLife,
								frightened: state.game.frightenedState.active,
								launch: state.game.launch,
								previousScore: previousScore.current,
								previousLife: previousLife.current,
								gameStarted: gameStarted.current
							});
						}}>🔍 Debug</button>
					</div>
				)}
			</div>
			<PauseMode state={state} />
			<div className="pacman-map-wrapper">
				<div className='column-left'></div>
				<div className="pacman-map-container" >
					{/* 1. Dessiner la grille : un <div> par case */}
					<div className='pacman-map'
						style={{
							position: 'absolute',
							top: offsetY,
							left: offsetX,
							width: `${mapWidth}px`,
							height: `${mapHeight}px`,
							transform: `scale(${scale})`,
							transformOrigin: 'top left'
						}}>
						{/* 1. Dessiner la grille : un <div> par case */}
						{/* 1. Dessiner les murs et les portes */}
						{grid.map((rowString, rowIndex) =>
							rowString.split('').map((char, colIndex) => {
								const tileClass = getTileClass(char, rowIndex, colIndex);
								const topPx = rowIndex * tileSize;
								const leftPx = colIndex * tileSize;
								return (
									<div
										key={`tile-${rowIndex}-${colIndex}`}
										className={tileClass}
										style={{
											top: topPx,
											left: leftPx,
											width: tileSize,
											height: tileSize,
										}}
									>
										{char === '-' && (
											<div
												className={`door ${(grid[rowIndex]?.[colIndex - 1] === '#' && grid[rowIndex]?.[colIndex + 1] === '#')
													? 'horizontal'
													: (grid[rowIndex - 1]?.[colIndex] === '#' && grid[rowIndex + 1]?.[colIndex] === '#')
														? 'vertical'
														: ''
													}`}
											/>
										)}
										{char === 'T' && <img src={portalImg} alt="portal" className="tunnel" />}
										{/* 2. Dessiner les éléments de la grille */}
										{char === '.' && <div className="dot" />}
										{char === 'o' && <div className="big-dot" />}
									</div>
								);
							})
						)}

						{/* 2. Superposer les joueurs */}
						{players.map(player => {
							// Pour Pacman
							if (player.character === 'P') {
								const direction = ((player as any).direction || 'RIGHT').toLowerCase();
								const isDying = (player as any).isDying; // À ajouter à votre interface Player si nécessaire

								// Sélection de l'image de Pacman
								let pacmanImage;
								if (isDying) {
									pacmanImage = pacmanImages.death;
								} else if (direction in pacmanImages) {
									pacmanImage = pacmanImages[direction as keyof typeof pacmanImages];
								} else {
									pacmanImage = pacmanImages.default;
								}

								// Position et styles
								const half = tileSize / 2;
								const posX = player.position?.x ?? 0;
								const posY = player.position?.y ?? 0;

								const baseStyle = {
									top: posY - half,
									left: posX - half,
									width: tileSize,
									height: tileSize,
									backgroundImage: `url(${pacmanImage})`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								} as React.CSSProperties;

								return (
									<div
										key={player.id}
										className="player pacman"
										style={baseStyle}
										title={`${player.username} (${player.score} pts)`}
									/>
								);
							}
							// Pour les fantômes
							else {
								// Déterminer quel GIF utiliser en fonction du caractère et de la direction
								const ghostChar = player.character; // 'B', 'P', 'I', 'C'
								//console.log('ghostChar', ghostChar);
								const direction = ((player as any).direction || 'RIGHT').toLowerCase();
								const isFrightened = (player as any).isFrightened;
								const frightenedState = state.game?.frightenedState;

								const isBlinking = isFrightened && 
												   frightenedState?.active && 
												   frightenedState?.remainingTime !== undefined &&
												   frightenedState?.remainingTime <= 5 && 
												   frightenedState?.remainingTime > 0;
								const isReturningToSpawn = (player as any).returnToSpawn === true;

								// For debugging - seulement en cas de blinking
								if (isBlinking) {
									console.log('👻 Ghost BLINKING:', {
										ghostChar,
										direction,
										remainingTime: frightenedState?.remainingTime,
										isBlinking
									});
								}

								// Sélection du GIF approprié
								// Solution plus simple mais moins sûre au niveau du typage
								let ghostImage;

								if (isReturningToSpawn) {
									ghostImage = ghostImages.eyes[direction as keyof typeof ghostImages.eyes];
								} else if (isBlinking) {
									ghostImage = ghostImages.blinking;
								} else if (isFrightened) {
									ghostImage = ghostImages.frightened;
								} else {
									// Utiliser as any pour contourner la vérification de type
									ghostImage = ghostChar && ghostChar in ghostImages
										? (ghostImages as any)[ghostChar][direction]
										: ghostImages.B.right;
								}

								const half = tileSize / 2;
								const posX = player.position?.x ?? 0;
								const posY = player.position?.y ?? 0;

								const baseStyle = {
									top: posY - half,
									left: posX - half,
									width: tileSize,
									height: tileSize,
									backgroundImage: `url(${ghostImage})`,
									backgroundSize: 'contain',
									backgroundRepeat: 'no-repeat',
									backgroundPosition: 'center',
								} as React.CSSProperties;

								// Style spécifique pour les fantômes
								let ghostClass = "player ghost";
								if (isReturningToSpawn) ghostClass += " returning-to-spawn";
								if (isFrightened) ghostClass += " frightened";
								if (isBlinking) ghostClass += " blinking";

								return (
									<div
										key={player.id}
										className={ghostClass}
										style={baseStyle}
										title={`${player.username} (${player.score} pts)`}
									></div>
								);
							}
						})}
					</div>
				</div>
				{/* 3. Afficher les scores */}
				<div className="column-right">
					<div className="life">
						<span className="life-text">Lives : </span>

						{/* Affichage des vies restantes de Pacman */}

						{/* {Array.from({ length: state.game?.pacmanLife || 0 }).map((_, index) => {
							// Vous pouvez placer votre console.log ici
							console.log('Vie restante:', index + 1);
							// Puis retourner l'élément JSX
							return <span key={index} className="heart">❤️</span>;
						})} */}
					</div>

					{/* Scores des joueurs */}
					{players.slice(0).map((player, index) => (
						<h3
							key={index}
							className="score"
							style={{
								color: player.character === 'P' ? 'yellow' : 'inherit',
								order: player.character === 'P' ? -1 : index
							}}
						>
							{player.username} : {player.score}
						</h3>
					))}

					{/* Console de débogage */}
					<div className="debug-console">
						<h4>Debug Info:</h4>
						<div className="debug-item">
							<span className="debug-label">Vies restantes:</span>
							<span className="debug-value">{state.game?.pacmanLife || 0}</span>
						</div>
						<div className="debug-item">
							<span className="debug-label">Statut effrayé:</span>
							<span className="debug-value">
								{state.game?.frightenedState?.remainingTime
									? `${Math.round(state.game.frightenedState.remainingTime)}s`
									: "Inactif"}
							</span>
						</div>
						<div className="debug-item">
							<span className="debug-label">Joueurs:</span>
							<span className="debug-value">{players.length}</span>
						</div>
						<div className="debug-item">
							<span className="debug-label">Taille grille:</span>
							<span className="debug-value">
								{grid.length > 0 ? `${grid.length}×${grid[0].length}` : "N/A"}
							</span>
						</div>
					</div>

					{/* Bouton Quitter */}
					<button
						className="quit-button"
						onClick={() => {
							if (state.ws && state.ws.readyState === WebSocket.OPEN) {
								state.ws.send(JSON.stringify({
									action: 'leaveRoom'
								}));
							}
						}}
					>
						Quitter la partie
					</button>
				</div>
			</div>
		</div>
	);
};

export default PacmanGame;
