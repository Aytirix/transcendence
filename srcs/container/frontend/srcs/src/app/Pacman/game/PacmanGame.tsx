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
	useGameLayout,
	useWallTypes,
	useKeyboardControls
} from './hooks';

import { useLanguage } from '../../../contexts/LanguageContext';

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
	const { t } = useLanguage();
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
					{/* Bloc Contrôles */}
					<div className="game-controls">
						<h4>{t("pacman.game.instructions.controls")}</h4>
						<div className="control-item">
							<span className="key">↑↓←→</span>
							<span className="action">{t("pacman.game.instructions.move")}</span>
						</div>
					</div>

					{/* Bloc Règles/Objectifs */}
					<div className="game-objectives">
						<h4>{t("pacman.game.instructions.objectives")}</h4>
						{(() => {
							// Trouver le joueur actuel dans la liste des joueurs de la partie
							const currentPlayer = players.find(p => p.id === state.player?.id);
							const playerCharacter = currentPlayer?.character;
							
							return (
								<>
									{/* Instructions spécifiques à Pacman */}
									{playerCharacter === 'P' && (
										<>
											<div className="instruction-note">
												{t("pacman.game.instructions.collectDots")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.avoidGhosts")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.eatPowerPills")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.pacman.survival")}
											</div>
										</>
									)}
									
									{/* Instructions spécifiques aux fantômes */}
									{playerCharacter && playerCharacter !== 'P' && (
										<>
											<div className="instruction-note">
												{t("pacman.game.instructions.ghost.catchPacman")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.ghost.avoidWhenFrightened")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.ghost.teamwork")}
											</div>
											<div className="instruction-note">
												{t("pacman.game.instructions.ghost.strategy")}
											</div>
										</>
									)}
								</>
							);
						})()}
					</div>

					{/* Statistiques de la partie */}
					<div className="game-stats">
						<h4>{t("pacman.game.statistics")}</h4>
						<div className="stat-item">
							<span className="stat-label">{t("pacman.game.remainingDots")}</span>
							<span className="stat-value">
								{grid?.join('').split('').filter(cell => cell === '.').length || 0}
							</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">{t("pacman.game.remainingPowerPills")}</span>
							<span className="stat-value">
								{grid?.join('').split('').filter(cell => cell === 'o').length || 0}
							</span>
						</div>
					</div>

					{/* État du jeu */}
					<div className="game-status">
						<h4>{t('pacman.game.status')}</h4>
						<div className="status-indicator">
							<span className={`status-dot ${state.game.launch ? 'active' : 'inactive'}`}></span>
							<span className="status-text">{state.game.launch ? t('pacman.game.inProgress') : t('pacman.game.waiting')}</span>
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
