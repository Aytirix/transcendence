// src/components/pacman/PacmanGame.tsx
import React from 'react';
import '../../assets/styles/pacman/PacmanGame.scss';
import { state } from '../../types/pacmanTypes';
import { 
	GameHeader, 
	PauseMode, 
	GameGrid, 
	GamePlayers, 
	GameSidebar,
	GameContainer
} from './components';
import { 
	useGameAssets, 
	useGameAudio, 
	useKeyboardControls, 
	useGameLayout,
	useWallTypes
} from './hooks';

interface PacmanGameProps {
	state: state;
}

const PacmanGame: React.FC<PacmanGameProps> = ({ state }) => {
	const { grid, players, tileSize } = state.game;

	// Utilisation des hooks modulaires
	const { ghostImages, pacmanImages } = useGameAssets();
	const { audioEnabled, handleFirstInteraction } = useGameAudio({
		players,
		pacmanLife: state.game.pacmanLife,
		frightenedState: state.game.frightenedState,
		launch: state.game.launch
	}, state.player?.id);
	const { scale, offsetX, offsetY } = useGameLayout({ grid, tileSize });
	const { getWallType } = useWallTypes();

	// Configuration des contrôles clavier
	useKeyboardControls({ 
		ws: state.ws, 
		onFirstInteraction: handleFirstInteraction 
	});

	return (
		<div className="PacmanGame" onClick={handleFirstInteraction}>
			<GameHeader 
				audioEnabled={audioEnabled}
				onFirstInteraction={handleFirstInteraction}
			/>

			<PauseMode 
				isPaused={state.game.paused.paused}
				message={state.game.paused.message}
			/>

			<div className="pacman-map-wrapper">
				<div className='column-left'>
					{/* Instructions de jeu */}
					<div className="game-instructions">
						<h4>Contrôles</h4>
						<div className="control-item">
							<span className="key">↑↓←→</span>
							<span className="action">Déplacer</span>
						</div>
						<div className="control-item">
							<span className="key">WASD</span>
							<span className="action">Alternatif</span>
						</div>
					</div>

					{/* Statistiques de la partie */}
					<div className="game-stats">
						<h4>Statistiques</h4>
						<div className="stat-item">
							<span className="stat-label">Dots restants:</span>
							<span className="stat-value">
								{grid?.join('').split('').filter(cell => cell === '.').length || 0}
							</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">Power Pills:</span>
							<span className="stat-value">
								{grid?.join('').split('').filter(cell => cell === 'o').length || 0}
							</span>
						</div>
					</div>

					{/* État du jeu */}
					<div className="game-status">
						<h4>État</h4>
						<div className="status-indicator">
							<span className={`status-dot ${state.game.launch ? 'active' : 'inactive'}`}></span>
							<span className="status-text">{state.game.launch ? 'En cours' : 'En attente'}</span>
						</div>
					</div>
				</div>
				<GameContainer
					grid={grid}
					tileSize={tileSize}
					scale={scale}
					offsetX={offsetX}
					offsetY={offsetY}
				>
					<GameGrid 
						grid={grid}
						tileSize={tileSize}
						getWallType={getWallType}
					/>
					<GamePlayers
						players={players}
						tileSize={tileSize}
						ghostImages={ghostImages}
						pacmanImages={pacmanImages}
						frightenedState={state.game.frightenedState}
					/>
				</GameContainer>
				<GameSidebar players={players} state={state} />
			</div>
		</div>
	);
};

export default PacmanGame;
