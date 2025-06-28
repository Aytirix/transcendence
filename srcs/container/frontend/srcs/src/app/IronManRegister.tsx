import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import GoogleLoginButton from './components/GoogleLoginButton';
import LanguageToggle from './components/LanguageToggle';
import notification from './components/Notifications';

interface RegisterSchema {
	email: string;
	password: string;
	username: string;
	confirmPassword: string;
	lang: string;
}

const IronManRegister: React.FC = () => {
	const { t, currentLanguage } = useLanguage();
	const [form, setForm] = useState<RegisterSchema>({
		email: '',
		password: '',
		username: '',
		confirmPassword: '',
		lang: currentLanguage,
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Synchroniser la langue du formulaire avec le changement de langue global
	useEffect(() => {
		setForm(prev => ({ ...prev, lang: currentLanguage }));
	}, [currentLanguage]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (form.password !== form.confirmPassword) {
			setError("Les mots de passe ne correspondent pas !");
			return;
		}
		setLoading(true);

		try {
			const resp: any = await ApiService.post('/register', form) as ApiService;
		} catch (err: any) {
			setError("Erreur réseau ou serveur.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
			{/* Décorations flottantes façon Intro */}
			<div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
				<div className="absolute left-10 top-10 animate-bounce-slow text-5xl opacity-30 select-none">🎮</div>
				<div className="absolute right-16 top-24 animate-float text-4xl opacity-20 select-none">🏆</div>
				<div className="absolute left-1/2 top-1/3 animate-float2 text-6xl opacity-10 select-none">💫</div>
				<div className="absolute right-1/3 bottom-10 animate-bounce-slow text-5xl opacity-20 select-none">👾</div>
			</div>

			{/* Bouton de changement de langue en haut à droite */}
			<div className="absolute top-4 right-4 z-10">
				<LanguageToggle />
			</div>

			<form className="z-10 w-full max-w-md" onSubmit={handleSubmit}>
				<fieldset className="bg-gray-900 bg-opacity-90 border border-gray-700 rounded-2xl shadow-2xl p-8 flex flex-col gap-4 items-center">
					<legend className="text-2xl font-bold text-center text-white tracking-widest gradient-text">{t('register.title')}</legend>

					<div className="flex justify-center mb-2">
						<GoogleLoginButton textbtn="signup" />
					</div>

					<input
						className="input input-a bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 rounded-md px-4 py-2 text-center"
						type="email"
						name="email"
						maxLength={50}
						placeholder={t('register.email')}
						value={form.email}
						onChange={handleChange}
						required
					/>

					<input
						className="input input-a bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 rounded-md px-4 py-2 text-center"
						type="text"
						name="username"
						maxLength={15}
						placeholder={t('register.username')}
						value={form.username}
						onChange={handleChange}
						required
					/>

					<input
						className="input input-a bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 rounded-md px-4 py-2 text-center"
						type="password"
						name="password"
						placeholder={t('register.password')}
						value={form.password}
						onChange={handleChange}
						required
					/>

					<input
						className="input input-a bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 rounded-md px-4 py-2 text-center"
						type="password"
						name="confirmPassword"
						placeholder={t('register.confirmPassword')}
						value={form.confirmPassword}
						onChange={handleChange}
						required
					/>

					<button className="btn btn-neutral mt-4 text-black font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 hover:from-pink-500 hover:to-yellow-400 transition-colors w-full rounded-md shadow-lg" type="submit" disabled={loading}>
						{loading ? "Création..." : t('register.submit')}
					</button>


					<div className="flex justify-center mt-2">
						<Link to="/login" className="text-gray-300 hover:text-yellow-400 transition-colors">
							{t('register.loginLink')}
						</Link>
					</div>
					{error && <div className="text-red-500 mt-4 text-center font-semibold">{error}</div>}
					{success && <div className="text-green-500 mt-4 text-center font-semibold">{success}</div>}
				</fieldset>
			</form>
		</div>
	);
};

export default IronManRegister;
