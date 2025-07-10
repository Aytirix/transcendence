import React from 'react';
import Board from './Board';
import Menu from './Menu';
import soloGame from './ws/SoloGame';
import './assets/styles/queens.scss';
import '../assets/styles/Star.scss';

const Solo: React.FC = () => {
	const { game, newGame, makeMove, undoMove, hint, solution, updateParameters, notification } = soloGame();

	if (!game || !game.map || !game.map.board_size || !game.state || !game.state.boardState) {
		return <div></div>;
	}

	return (
		<div id="PacmanStars">
			<div className="star-background">
				<div id="stars-bright"></div>
				<div id="shooting-stars">
					<span></span><span></span><span></span><span></span><span></span>
				</div>
			</div>
			<div className="queens-page">
				<Menu game={game} updateParameters={updateParameters} />
				<div className="container text-center title">
					<h1 style={{ color: 'white' }}>Jeu Queens – Une reine par couleur</h1>
					<div id="btn-action">
						<button onClick={undoMove} className="btn btn-secondary text-black">
							Retour
						</button>
						<button onClick={hint} className="btn btn-warning">
							Indice
						</button>
						<button onClick={solution} className="btn btn-info">
							Afficher solution
						</button>
						<button onClick={newGame} className="btn btn-primary text-black">
							Nouvelle partie
						</button>
					</div>
					{/* Affichage du plateau de jeu */}
					{game && <Board game={game} makeMove={makeMove} />}
					<div id="message">
						{notification.message && (
							<div className={`${notification.type}`} role="alert">
								{notification.message}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Solo;
