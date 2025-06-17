import React from 'react';
import '../../assets/styles/pacman/Rules.scss';
import { useGameRules } from './hooks/useGameRules';
import RulesList from './components/RulesList';

const Rules: React.FC = () => {
	const { rules } = useGameRules();

	return (
		<div className='rules'>
			<h2 className='rules-title'>Règles du jeu</h2>
			<RulesList rules={rules} />
			<div className='rules-footer'>
				<p>Amusez-vous bien !</p>
			</div>
		</div>
	);
};

export default Rules;
