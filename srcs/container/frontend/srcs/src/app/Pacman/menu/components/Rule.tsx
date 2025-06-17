import React from 'react';

interface RuleProps {
	number: number;
	text: string;
}

const Rule: React.FC<RuleProps> = ({ number, text }) => {
	return <p>{number}. {text}</p>;
};

export default Rule;
