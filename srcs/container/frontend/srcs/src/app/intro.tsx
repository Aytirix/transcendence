// import './assets/styles/App.scss';
import ApiService from '../api/ApiService';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
function intro() {
    const { t, i18n } = useTranslation();
    // console.log("speudo", speudo);
    useEffect(() => {
        async function readLang() {
            const res = await ApiService.get('/isAuth');
            const lang = res.user?.lang || 'fr';
            i18n.changeLanguage(lang);
        }
        readLang();
    }, [i18n]);
    const user = useAuth();
    return (
        <div className="intro">
            <h1>{t('hello')} {user.user?.username}</h1>
            <p>{t('test')}</p>
        </div>
    );
}

export default intro;


