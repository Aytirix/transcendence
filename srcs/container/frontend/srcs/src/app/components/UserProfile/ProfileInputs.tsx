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
	
	// Fonction pour gérer le changement du toggle 2FA
	const handleTwofaChange = (e: ChangeEvent<HTMLInputElement>) => {
		const syntheticEvent = {
			target: {
				name: 'twofa',
				value: e.target.checked
			}
		} as unknown as ChangeEvent<HTMLInputElement>;
		handleChange(syntheticEvent);
	};
	
	return (
		<div className="flex flex-col items-center gap-4 w-full">
			<input
				className="input w-full max-w-md bg-gray-800 text-white"
				type="text"
				name="username"
				placeholder={form?.username || t('profile.form.username.placeholder')}
				value={form.username || ''}
				maxLength={10}
				onChange={handleChange}
			/>
			<input
				className="input w-full max-w-md bg-gray-800 text-white"
				type="email"
				name="email"
				placeholder={form?.email || t('profile.form.email.placeholder')}
				value={form.email || ''}
				maxLength={50}
				onChange={handleChange}
			/>
			<input
				className="input w-full max-w-md bg-gray-800 text-white"
				type="password"
				name="password"
				placeholder={t('profile.form.password.placeholder')}
				value={form.password || ''}
				onChange={handleChange}
			/>
			<input
				className="input w-full max-w-md bg-gray-800 text-white"
				type="password"
				name="confirmPassword"
				placeholder={t('profile.form.confirmPassword.placeholder')}
				value={form.confirmPassword || ''}
				onChange={handleChange}
			/>
			<select className="select w-full max-w-md bg-gray-800 text-white" value={form.lang || ''} name="lang" onChange={handleChange}>
				<option disabled={true} value="">{t('profile.form.language.placeholder')}</option>
				<option value="fr">{t('profile.form.language.options.fr')}</option>
				<option value="en">{t('profile.form.language.options.en')}</option>
				<option value="es">{t('profile.form.language.options.es')}</option>
				<option value="it">{t('profile.form.language.options.it')}</option>
			</select>
			
			{/* Toggle 2FA */}
			<div className="flex items-center justify-between w-full max-w-md bg-gray-800 text-white rounded-md px-4 py-3">
				<span className="text-sm font-medium">{t('profile.form.twofa.label')}</span>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						name="twofa"
						checked={form.twofa || false}
						onChange={handleTwofaChange}
						className="sr-only peer"
					/>
					<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
				</label>
			</div>
		</div>
	);
};

export default ProfileInputs;
