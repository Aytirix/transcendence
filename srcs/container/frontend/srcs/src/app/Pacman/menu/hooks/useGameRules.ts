import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useGameRules() {
	const { t } = useTranslation();

	const rules = useMemo(() => [
		t("Le jeu se joue entre 2 à 5 joueurs."),
		t("Le jeu se joue en 3 manches de 5 minutes."),
		t("Chaque joueur doit choisir un personnage."),
		t("Le but du jeu est de marquer le plus de points possible."),
		t("Les joueurs peuvent utiliser des power-ups pour gagner un avantage."),
		t("Les joueurs peuvent se battre entre eux pour obtenir des bonus."),
		t("Le joueur avec le plus de points à la fin des 3 manches gagne.")
	], [t]);

	return { rules };
}
