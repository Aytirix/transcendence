import { useMemo } from 'react';

export function useGameRules() {
	const rules = useMemo(() => [
		"Le jeu se joue entre 2 à 5 joueurs.",
		"Le jeu se joue en 3 manches de 5 minutes.",
		"Chaque joueur doit choisir un personnage.",
		"Le but du jeu est de marquer le plus de points possible.",
		"Les joueurs peuvent utiliser des power-ups pour gagner un avantage.",
		"Les joueurs peuvent se battre entre eux pour obtenir des bonus.",
		"Le joueur avec le plus de points à la fin des 3 manches gagne."
	], []);

	return { rules };
}
