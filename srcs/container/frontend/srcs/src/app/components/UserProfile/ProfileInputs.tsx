import React, { ChangeEvent } from 'react';
import { ProfileForm } from '../../IronManProfile';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProfileInputsProps {
	form: ProfileForm;
	handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	user: any;
}

const ProfileInputs: React.FC<ProfileInputsProps> = ({ form, handleChange }) => {
	const { t } = useLanguage();
	
	return (
	<div className="flex flex-col items-center gap-4 w-full">
		<input
			className="input w-full max-w-md bg-gray-800 text-white"
			type="text"
			name="username"
			placeholder={form?.username || t('profile.form.username.placeholder')}
			value={form.username}
			maxLength={10}
			onChange={handleChange}
			
		/>
		<input
			className="input w-full max-w-md bg-gray-800 text-white"
			type="email"
			name="email"
			placeholder={form?.email || t('profile.form.email.placeholder')}
			value={form.email}
			maxLength={50}
			onChange={handleChange}
		/>
		<input
			className="input w-full max-w-md bg-gray-800 text-white"
			type="password"
			name="password"
			placeholder={t('profile.form.password.placeholder')}
			value={form.password}
			onChange={handleChange}
		/>
		<input
			className="input w-full max-w-md bg-gray-800 text-white"
			type="password"
			name="confirmPassword"
			placeholder={t('profile.form.confirmPassword.placeholder')}
			value={form.confirmPassword}
			onChange={handleChange}
		/>
		<select className="select w-full max-w-md bg-gray-800 text-white" value={form.lang} name="lang" onChange={handleChange}>
			<option disabled={true} value="">{t('profile.form.language.placeholder')}</option>
			<option value="fr">{t('profile.form.language.options.fr')}</option>
			<option value="en">{t('profile.form.language.options.en')}</option>
			<option value="es">{t('profile.form.language.options.es')}</option>
			<option value="it">{t('profile.form.language.options.it')}</option>
		</select>
	</div>
);
};

export default ProfileInputs;
