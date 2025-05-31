import './assets/styles/App.scss';
import ApiService from '../api/ApiService';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function intro() {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        async function readLang() {
            const res = await ApiService.get('/isAuth');
            const lang = res.user?.lang || 'fr';
            i18n.changeLanguage(lang);
        }
        readLang();
    }, [i18n]);

    return (
        <div className="intro">
            <h1>{t('hello')}</h1>
            <p>{t('test')}</p>
        </div>
    );
}

export default intro;


