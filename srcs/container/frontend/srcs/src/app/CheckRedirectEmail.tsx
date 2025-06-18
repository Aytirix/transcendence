import { Link, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

interface CheckRedirectEmailProps {
	validationRoute: string;
	redirectUrl?: string;
}

const CheckRedirectEmail: React.FC<CheckRedirectEmailProps> = ({
	validationRoute,
	redirectUrl = '/',
}) => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		const code = searchParams.get('code');
		if (code) {
			validateAccount(code);
		} else {
			navigate('/');
		}
	}, [searchParams]);

	const validateAccount = async (code: string) => {

		try {
			const payload = {
				code: code,
			};

			const resp = await ApiService.post(validationRoute, payload as any);

			if (!resp.ok) {
				navigate('/');
			} else {
				if (redirectUrl) {
					navigate(redirectUrl);
				} else {
					navigate('/');
				}
			}
		} catch (err: any) {
			navigate('/');
		}
	};

	return (
		<>
		</>
	);
};

export default CheckRedirectEmail;