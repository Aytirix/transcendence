import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useLanguage } from '../contexts/LanguageContext';

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

	const validatePassword = (password: string): boolean => {
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,25}$/;
		return passwordRegex.test(password);
	};

	const getPasswordValidation = (password: string) => {
		return {
			length: password.length >= 8 && password.length <= 25,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			number: /\d/.test(password),
			special: /[@$!%*?&.]/.test(password)
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
		<div className="flex justify-center items-center min-h-screen bg-gray-100">
			<div className="bg-white rounded-xl p-12 shadow-lg text-center max-w-xl w-full mx-4">
				<div className="text-6xl mb-8">
					{getIcon()}
				</div>
				<h2 className="text-3xl font-bold mb-8 text-gray-800">
					{getTitle()}
				</h2>
				
				{status === 'form' && (
					<form onSubmit={handlePasswordSubmit} className="text-left">
						<div className="mb-4">
							<label className="block text-gray-700 text-sm font-bold mb-2">
								{t('forgetPassword.resetPassword.password')}
							</label>
							<input
								type="password"
								name="password"
								value={passwordForm.password}
								onChange={handlePasswordChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
							<div className="mt-2 p-3 bg-gray-50 rounded-md">
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
							<label className="block text-gray-700 text-sm font-bold mb-2">
								{t('forgetPassword.resetPassword.confirmPassword')}
							</label>
							<input
								type="password"
								name="confirmPassword"
								value={passwordForm.confirmPassword}
								onChange={handlePasswordChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
					<p className="text-gray-600 text-xl">
						Vérification en cours...
					</p>
				)}
				{status === 'success' && (
					<div>
						<p className="text-green-600 text-xl font-semibold mb-6">
							{message}
						</p>

						{redirect && (
							<p className="text-gray-500 text-base">
								Redirection en cours...
							</p>
						)}
					</div>
				)}
				{status === 'error' && (
					<p className="text-red-600 text-xl font-semibold">
						{message}
					</p>
				)}
			</div>
		</div>
	);
};

export default CheckRedirectEmail;