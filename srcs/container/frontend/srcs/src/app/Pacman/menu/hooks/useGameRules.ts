import { useMemo } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';


export function useGameRules() {
	const { t } = useLanguage();

	const rules = useMemo(() => [
		t("pacman.menu.rules.content1"),
		t("pacman.menu.rules.content2"),
		t("pacman.menu.rules.content3"),
		t("pacman.menu.rules.content4"),
		t("pacman.menu.rules.content5")
	], [t]);

	return { rules };
}
