// import './assets/styles/App.scss';
import ApiService from '../api/ApiService';
import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function intro() {
	const { t, setLanguage, currentLanguage } = useLanguage();

	const user = useAuth();
	return (
		<div className="intro">
			<h1>{t('hello')} {user.user?.username}</h1>
			<p>{t('test')}</p>
		</div>
	);
}

export default intro;


