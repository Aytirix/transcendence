import React, { ChangeEvent } from "react";

interface LangSelectProps {
	value: string | undefined;
	onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const LangSelect: React.FC<LangSelectProps> = ({ value, onChange }) => (
	<select className="select" name="lang" value={value} onChange={onChange}>
		<option disabled value="">Langue...</option>
		<option value="fr">Français</option>
		<option value="en">English</option>
		<option value="es">Español</option>
		<option value="it">Italia</option>
	</select>
);

export default LangSelect;
