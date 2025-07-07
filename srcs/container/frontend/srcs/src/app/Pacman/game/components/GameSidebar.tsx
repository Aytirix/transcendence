import React, { useState, useEffect } from 'react';
import { player, state } from '../../../types/pacmanTypes';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface GameSidebarProps {
	players: player[];
	state: state;
}

const GameSidebar: React.FC<GameSidebarProps> = ({ players, state }) => {
	const { t } = useLanguage();
	const [gameTime, setGameTime] = useState(0);

	// Timer pour le temps de jeu
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (state.game?.launch) {
			interval = setInterval(() => {
				setGameTime(prev => prev + 1);
			}, 1000);
		} else {
			setGameTime(0);
		}
		return () => clearInterval(interval);
	}, [state.game?.launch]);

	// Formatage du temps de jeu
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Séparer Pacman des fantômes pour un meilleur affichage
	// const pacmanPlayer = players.find(p => p.character === 'P');
	// const ghostPlayers = players.filter(p => p.character !== 'P');

	// Fonction pour obtenir la pastille colorée selon le personnage
	const getCharacterDot = (player: player) => {
		const character = player.character;
		
		// Vérifier si le joueur est un fantôme effrayé (seulement pour les fantômes, pas Pacman)
		const isGhost = character !== 'P';
		const isFrightened = isGhost && state.game?.frightenedState?.active;
		const remainingTime = state.game?.frightenedState?.remainingTime || 0;
		const isBlinking = isFrightened && remainingTime <= 3000 && remainingTime > 0; // Clignote dans les 3 dernières secondes
		
		// Classes CSS conditionnelles
		let dotClass = "character-dot";
		if (isFrightened) {
			dotClass += " frightened-dot";
			if (isBlinking) {
				dotClass += " blinking-dot";
			}
		}

		switch (character) {
			case 'P': return <span className={`${dotClass} pacman-dot`}>●</span>; // Jaune
			case 'B': return <span className={`${dotClass} blinky-dot`}>●</span>; // Rouge ou bleu si effrayé
			case 'Y': return <span className={`${dotClass} pinky-dot`}>●</span>; // Rose ou bleu si effrayé
			case 'I': return <span className={`${dotClass} inky-dot`}>●</span>; // Cyan ou bleu si effrayé
			case 'C': return <span className={`${dotClass} clyde-dot`}>●</span>; // Orange ou bleu si effrayé
			default: return <span className={`${dotClass} default-dot`}>●</span>; // Blanc par défaut
		}
	};

	// Calculer le score total
	const totalScore = players.reduce((sum, player) => sum + (player.score || 0), 0);
	const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

	// Affichage des vies avec icônes
	const renderLives = () => {
		const maxLives = 3;
		const currentLives = state.game?.pacmanLife || 0;
		
		return (
			<div className="lives-container">
				<span className="lives-label">{t("pacman.game.pacmanLife")}</span>
				<div className="lives-display">
					{Array.from({ length: maxLives }, (_, index) => (
						<span 
							key={index} 
							className={`life-icon ${index < currentLives ? 'active' : 'inactive'}`}
						>
							🟡
						</span>
					))}
				</div>
			</div>
		);
	};

	// Affichage amélioré des scores
	const renderPlayerScore = (player: player, rank: number) => {
		const scoreClass = `player-score `;
		
		return (
			<div key={player.id} className={scoreClass}>
				<div className="player-info">
					<span className="rank">#{rank}</span>
					{getCharacterDot(player)}
					<span className="player-name">{player.username}</span>
				</div>
				<div className="score-value">
					{(player.score || 0).toLocaleString()}
				</div>
			</div>
		);
	};

	return (
		<div className="game-sidebar">
			{/* Section des vies améliorée */}
			{renderLives()}

			{/* Section des scores avec classement */}
			<div className="scores-section">
				<h4 className="section-title">🏆 {t("pacman.game.score")}</h4>
				<div className="scores-list">
					{sortedPlayers.map((player, index) => renderPlayerScore(player, index + 1))}
				</div>
				<div className="total-score">
					<span className="total-label">{t("pacman.game.total")}</span>
					<span className="total-value">{totalScore.toLocaleString()}</span>
				</div>
			</div>

			{/* Info de jeu - style classique comme .debug-console */}
			<div className="game-stats">
				<h4 className="section-title">⏱️ {t("pacman.game.time")}</h4>
				<span className="stat-value">{formatTime(gameTime)}</span>
			</div>

			{/* Bouton Quitter amélioré */}
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
				<span className="quit-text">{t("pacman.game.quit")}</span>
			</button>
		</div>
	);
};

export default GameSidebar;
