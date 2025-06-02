// import IronManNavBar from './IronManNavBar';
import Intro from './intro';
import './assets/styles/App.scss';
import ApiService from '../api/ApiService';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';




async function readLang(i18n:any) {
    const res = await ApiService.get('/isAuth');
    const lang = res.user?.lang || 'fr';
    i18n.changeLanguage(lang);
    const user2 = res.user2?.username;
    console.log("USER",user2);
    return user2;
}

function App() {
    const { i18n } = useTranslation();
    // let user: string;
    useEffect(() => {readLang(i18n);}, [i18n]);
    // console.log("USERs",user);
    return (
        <div id="root">
            <Intro />
        </div>
    );
}

export default App;


