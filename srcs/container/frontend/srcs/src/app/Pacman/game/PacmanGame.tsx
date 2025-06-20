// src/components/pacman/PacmanGame.tsx
import React from 'react';
import '../../assets/styles/pacman/PacmanGame.scss';
import { state } from '../../types/pacmanTypes';
import { 
	GameHeader, 
	PauseMode, 
	GameGrid, 
	GamePlayers, 
	AudioControls, 
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

			<AudioControls 
				audioEnabled={audioEnabled} 
				players={players} 
				state={state} 
			/>

			<PauseMode 
				isPaused={state.game.paused.paused}
				message={state.game.paused.message}
			/>

			<div className="pacman-map-wrapper">
				<div className='column-left'></div>
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
