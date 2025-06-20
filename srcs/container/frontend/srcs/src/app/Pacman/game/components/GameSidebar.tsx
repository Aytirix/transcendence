import React from 'react';
import { player, state } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface GameSidebarProps {
	players: player[];
	state: state;
}

const GameSidebar: React.FC<GameSidebarProps> = ({ players, state }) => {
	const { t } = useLanguage();

	return (
		<div className="column-right">
			<div className="life">
				<span className="life-text">{t("pacman.game.pacmanLife")} : {state.game?.pacmanLife || 0}</span>
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
						{state.game.grid.length > 0 ? `${state.game.grid.length}×${state.game.grid[0].length}` : "N/A"}
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
				{t("pacman.game.quit")}
			</button>
		</div>
	);
};

export default GameSidebar;
