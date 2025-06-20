import React from 'react';
import '../../assets/styles/pacman/Rules.scss';
import { useGameRules } from './hooks/useGameRules';
import { useLanguage } from '../../../contexts/LanguageContext';
import RulesList from './components/RulesList';

const Rules: React.FC = () => {
	const { rules } = useGameRules();
	const { t } = useLanguage();

	return (
		<div className='rules'>
			<h2 className='rules-title'>{t('pacman.menu.rules.title')}</h2>
			<RulesList rules={rules} />
			<div className='rules-footer'>
				<p>{t('pacman.menu.rules.footer')}</p>
			</div>
		</div>
	);
};

export default Rules;
