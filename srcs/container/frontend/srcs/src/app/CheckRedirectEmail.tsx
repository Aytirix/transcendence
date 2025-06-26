import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import notification from './components/Notifications';

const CheckRedirectEmail: React.FC = () => {
	const { t } = useLanguage();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'form'>('loading');
	const [message, setMessage] = useState<string>('');
	const [validationType, setValidationType] = useState<string>('');
	const [redirect, setRedirect] = useState<string | null>(null);
	const [code, setCode] = useState<string>('');
	const [passwordForm, setPasswordForm] = useState({
		password: '',
		confirmPassword: ''
	});
	const [formLoading, setFormLoading] = useState(false);

	useEffect(() => {
		const codeParam = searchParams.get('code');
		const type = searchParams.get('type');
		const redirectParam = searchParams.get('redirectUrl');
		if (codeParam && type) {
			setValidationType(type);
			setRedirect(redirectParam);
			setCode(codeParam);

			if (type === 'forget_password') {
				setStatus('form');
			} else {
				validateAccount(codeParam, redirectParam);
			}
		} else {
			setStatus('error');
			setMessage('Paramètres manquants');
		}
	}, [searchParams]);

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPasswordForm({
			...passwordForm,
			[e.target.name]: e.target.value
		});
	};

	const getPasswordValidation = (password: string) => {
		return {
			length: password.length >= 8 && password.length <= 25,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			number: /\d/.test(password),
			special: /[@$!%$#^:;'"|*?&.,<>\\/-_=+()]/.test(password)
		};
	};

	const isPasswordValid = (password: string): boolean => {
		const validation = getPasswordValidation(password);
		return validation.length && validation.lowercase && validation.uppercase && validation.number && validation.special;
	};

	const isFormValid = (): boolean => {
		return isPasswordValid(passwordForm.password) &&
			passwordForm.password === passwordForm.confirmPassword &&
			passwordForm.password.length > 0 &&
			passwordForm.confirmPassword.length > 0;
	};

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (passwordForm.password !== passwordForm.confirmPassword) {
			setMessage(t('forgetPassword.resetPassword.passwordMismatch'));
			return;
		}

		setFormLoading(true);
		setMessage('');

		try {
			const payload = {
				code: code,
				password: passwordForm.password,
				confirmPassword: passwordForm.confirmPassword
			};

			const resp = await ApiService.post("/auth/checkCode", payload as any, false);

			if (!resp.ok) {
				setMessage(resp.message || t('forgetPassword.resetPassword.error'));
			} else {
				setStatus('success');
				setMessage(t('forgetPassword.resetPassword.success'));
				setTimeout(() => {
					navigate('/login');
				}, 2000);
			}
		} catch (err: any) {
			setMessage(t('forgetPassword.resetPassword.error'));
		} finally {
			setFormLoading(false);
		}
	};

	const validateAccount = async (code: string, redirect: string | null) => {
		try {
			const payload = {
				code: code,
			};

			const resp = await ApiService.post("/auth/checkCode", payload as any, false);

			if (!resp.ok) {
				setStatus('error');
				setMessage(resp.message || 'Erreur lors de la validation');
				if (redirect) {
					setTimeout(() => {
						navigate('/login');
					}, 2000);
				}
			} else {
				setStatus('success');
				setMessage(resp.message || 'Succès !');
				if (redirect) {
					setTimeout(() => {
						navigate(redirect);
					}, 2000);
				}
			}
		} catch (err: any) {
			setStatus('error');
			setMessage('Erreur lors de la validation');
		}
	};

	const getTitle = () => {
		if (validationType === 'createAccount_confirm_email') {
			return 'Confirmation d\'adresse email';
		} else if (validationType === 'update_confirm_email') {
			return 'Confirmation Changement d\'email';
		} else if (validationType === 'forget_password') {
			return t('forgetPassword.resetPassword.title');
		}
		return 'Validation';
	};

	const getIcon = () => {
		if (status === 'loading') return '⏳';
		if (status === 'success') return '✅';
		if (status === 'form') return '🔐';
		return '❌';
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

			<div className="absolute top-4 right-4 z-10">
				{/* Pas de bouton de langue ici, mais on peut l'ajouter si besoin */}
			</div>

			<div className="z-10 w-full max-w-xl flex justify-center">
				<div className="bg-gray-900 bg-opacity-90 border border-gray-700 rounded-2xl shadow-2xl p-8 flex flex-col gap-4 w-full">
					<div className="text-6xl mb-4 text-center">{getIcon && getIcon()}</div>
					<h2 className="text-3xl font-bold mb-4 text-white text-center tracking-widest gradient-text">{getTitle && getTitle()}</h2>
					{/* Formulaire ou messages */}
					{status === 'form' && (
						<form onSubmit={handlePasswordSubmit} className="text-left">
							<div className="mb-4">
								<label className="block text-gray-300 text-sm font-bold mb-2">
									{t('forgetPassword.resetPassword.password')}
								</label>
								<input
									type="password"
									name="password"
									value={passwordForm.password}
									onChange={handlePasswordChange}
									className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${formLoading ? 'bg-gray-700 cursor-[url(https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f512.png),_pointer]' : ''}`}
									disabled={formLoading}
									required
								/>
								<div className="mt-2 p-3 bg-gray-200 rounded-md">
									<p className="text-sm font-semibold text-gray-700 mb-2">
										{t('forgetPassword.resetPassword.passwordRequirements.title')}
									</p>
									{(() => {
										const validation = getPasswordValidation(passwordForm.password);
										return (
											<ul className="text-xs space-y-1">
												<li className={validation.length ? 'text-green-600' : 'text-red-600'}>
													• {t('forgetPassword.resetPassword.passwordRequirements.length')}
												</li>
												<li className={validation.lowercase ? 'text-green-600' : 'text-red-600'}>
													• {t('forgetPassword.resetPassword.passwordRequirements.lowercase')}
												</li>
												<li className={validation.uppercase ? 'text-green-600' : 'text-red-600'}>
													• {t('forgetPassword.resetPassword.passwordRequirements.uppercase')}
												</li>
												<li className={validation.number ? 'text-green-600' : 'text-red-600'}>
													• {t('forgetPassword.resetPassword.passwordRequirements.number')}
												</li>
												<li className={validation.special ? 'text-green-600' : 'text-red-600'}>
													• {t('forgetPassword.resetPassword.passwordRequirements.special')}
												</li>
											</ul>
										);
									})()}
								</div>
							</div>
							<div className="mb-6">
								<label className="block text-gray-300 text-sm font-bold mb-2">
									{t('forgetPassword.resetPassword.confirmPassword')}
								</label>
								<input
									type="password"
									name="confirmPassword"
									value={passwordForm.confirmPassword}
									onChange={handlePasswordChange}
									className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${formLoading ? 'bg-gray-700 cursor-[url(https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f512.png),_pointer]' : ''}`}
									disabled={formLoading}
									required
								/>
								{passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword && (
									<p className="text-red-600 text-xs mt-1">
										{t('forgetPassword.resetPassword.passwordMismatch')}
									</p>
								)}
							</div>
							<button
								type="submit"
								disabled={formLoading || !isFormValid()}
								className="w-full bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{formLoading ? t('forgetPassword.resetPassword.loading') : t('forgetPassword.resetPassword.submit')}
							</button>
							{message && (
								<p className="text-red-600 text-sm mt-4 text-center">
									{message}
								</p>
							)}
						</form>
					)}
					{status === 'loading' && (
						<p className="text-gray-300 text-xl text-center">
							Vérification en cours...
						</p>
					)}
					{status === 'success' && (
						<div>
							<p className="text-green-400 text-xl font-semibold mb-6 text-center">
								{message}
							</p>

							{redirect && (
								<p className="text-gray-400 text-base text-center">
									Redirection en cours...
								</p>
							)}
						</div>
					)}
					{status === 'error' && (
						<p className="text-red-500 text-xl font-semibold text-center">
							{message}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default CheckRedirectEmail;