import React, { ChangeEvent } from 'react';
import { ProfileForm } from '../../IronManProfile';

interface ProfileInputsProps {
	form: ProfileForm;
	handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	user: any;
}

const ProfileInputs: React.FC<ProfileInputsProps> = ({ form, handleChange }) => (
	<div className="flex flex-col items-center gap-4 w-full">
		<input
			className="input w-full max-w-md"
			type="text"
			name="username"
			placeholder={form?.username || "Pseudo"}
			value={form.username}
			onChange={handleChange}
		/>
		<input
			className="input w-full max-w-md"
			type="email"
			name="email"
			placeholder={form?.email || "E-mail"}
			value={form.email}
			onChange={handleChange}
		/>
		<input
			className="input w-full max-w-md"
			type="password"
			name="password"
			placeholder="Nouveau mot de passe"
			value={form.password}
			onChange={handleChange}
		/>
		<input
			className="input w-full max-w-md"
			type="password"
			name="confirmPassword"
			placeholder="Confirmer le mot de passe"
			value={form.confirmPassword}
			onChange={handleChange}
		/>
		<select className="select w-full max-w-md" value={form.lang} name="lang" onChange={handleChange}>
			<option disabled={true} value="">Langue...</option>
			<option value="fr">Français</option>
			<option value="en">English</option>
			<option value="es">Español</option>
			<option value="it">Italia</option>
		</select>
	</div>
);

export default ProfileInputs;
