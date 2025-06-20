import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

import LanguageToggle from './components/LanguageToggle';

interface ForgetPasswordSchema {
	email: string;
}

const IronManForgetPass: React.FC = () => {
	const { t, currentLanguage } = useLanguage();
	const [form, setForm] = useState<ForgetPasswordSchema>({ email: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const navigate = useNavigate();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			const data: any = await ApiService.post('/forget-password', form, false) as ApiService;
			console.log('Response from forget-password:', data);
			if (!data.ok) {
				setError(data.message || t('forgetPassword.error'));
			} else {
				setSuccess(data.message || t('forgetPassword.success'));
			}
		} catch (err) {
			console.error('Error during password reset:', err);
			setError(t('forgetPassword.networkError'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center relative">
			{/* Bouton de changement de langue en haut à droite */}
			<div className="absolute top-4 right-4">
				<LanguageToggle />
			</div>

			<form className=" " onSubmit={handleSubmit}>
				<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
					<legend className="fieldset-legend">{t('forgetPassword.title')}</legend>

					<label className="label">{t('forgetPassword.email')}</label>
					<input
						type="email"
						name="email"
						className="input input-a"
						placeholder={`  ${t('forgetPassword.email')}`}
						onChange={handleChange}
						required
					/>

					<button className="btn btn-neutral mt-4 text-black" type="submit" disabled={loading}>
						{loading ? t('forgetPassword.loading') : t('forgetPassword.submit')}
					</button>

					<div className="flex justify-center mt-4">
						<Link to="/login" className="link link-hover">
							{t('forgetPassword.backToLogin')}
						</Link>
					</div>

					{error && <div style={{ color: '#c20000', marginTop: '16px', textAlign: 'center' }}>{error}</div>}
					{success && <div style={{ color: '#00c200', marginTop: '16px', textAlign: 'center' }}>{success}</div>}
				</fieldset>
			</form>
		</div>
	);
};

export default IronManForgetPass;


