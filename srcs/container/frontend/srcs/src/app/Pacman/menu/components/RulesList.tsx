import React from 'react';
import Rule from './Rule';

interface RulesListProps {
	rules: string[];
}

const RulesList: React.FC<RulesListProps> = ({ rules }) => {
	return (
		<div className='rules-content'>
			{rules.map((rule, index) => (
				<Rule key={index} number={index + 1} text={rule} />
			))}
		</div>
	);
};

export default RulesList;
