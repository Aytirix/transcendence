import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';

const CheckRedirectEmail: React.FC = () => {

	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState<string>('');
	const [validationType, setValidationType] = useState<string>('');
	const [redirect, setRedirect] = useState<string | null>(null);

	useEffect(() => {
		const code = searchParams.get('code');
		const type = searchParams.get('type');
		const redirect = searchParams.get('redirectUrl');
		if (code && type) {
			setValidationType(type);
			setRedirect(redirect);
			validateAccount(code, redirect);
		} else {
			setStatus('error');
			setMessage('Paramètres manquants');
		}
	}, [searchParams]);

	const validateAccount = async (code: string, redirect: string | null) => {
		try {
			const payload = {
				code: code,
			};

			const resp = await ApiService.post("/auth/checkCode", payload as any, false);

			if (!resp.ok) {
				setStatus('error');
				setMessage(resp.message || 'Erreur lors de la validation');
			} else {
				setStatus('success');
				setMessage(resp.message || 'Succès !');
			}
			if (redirect) {
				setTimeout(() => {
					navigate(redirect);
				}, 2000);
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
		}
		return 'Validation';
	};

	const getIcon = () => {
		if (status === 'loading') return '⏳';
		if (status === 'success') return '✅';
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