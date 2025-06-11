import React from 'react';
// import '../../assets/styles/pacman/Rules.scss';

const Rules: React.FC = () => {
	return (
		<div className='rules'>
			<h2 className='rules-title'>Règles du jeu</h2>
			<div className='rules-content'>
				<p>1. Le jeu se joue entre 2 à 5 joueurs.</p>
				<p>2. Le jeu se joue en 3 manches de 5 minutes.</p>
				<p>3. Chaque joueur doit choisir un personnage.</p>
				<p>4. Le but du jeu est de marquer le plus de points possible.</p>
				<p>5. Les joueurs peuvent utipser des power-ups pour gagner un avantage.</p>
				<p>6. Les joueurs peuvent se battre entre eux pour obtenir des bonus.</p>
				<p>7. Le joueur avec le plus de points à la fin des 3 manches gagne.</p>
			</div>
			<div className='rules-footer'>
				<p>Amusez-vous bien !</p>
			</div>
		</div>
	);
};

export default Rules;
