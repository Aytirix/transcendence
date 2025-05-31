// import { Link } from 'react-router-dom';
// import './assets/styles/App.scss'
// import { useLanguage } from '../contexts/LanguageContext';

// function App() {
// 	const { t, setLanguage } = useLanguage();

// 	return (
// 		<>
// 			<nav className="flex flex-col gap-4">
// 				<Link to="/Pacman">Pacman</Link>
// 				<Link to="/WebSocketTest">userTest</Link>
// 				<Link to="/Pong">pong tests</Link>
// 				<Link to="/ModuleManager">Module Manager</Link>
// 			</nav>
// 			<div>
// 				<button onClick={() => setLanguage('fr')}>Français</button>
// 				<button onClick={() => setLanguage('en')}>English</button>
// 				<button onClick={() => setLanguage('es')}>Español</button>
// 			</div>
// 			<h1>{t('test')}</h1>
// 		</>
// 	)
// }

// export default App



import IronManNavBar from './IronManNavBar'; // adapte le chemin si besoin
import './assets/styles/App.scss';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../api/ApiService';
import { useEffect, useState } from 'react';

function App() {
    const { t, setLanguage , } = useLanguage();
    const [language, setLangState] = useState(null);

    useEffect(() => {
        async function readLang() {
            const lang = await ApiService.get('/isAuth');
            setLangState(lang.user?.lang);
            setLanguage(lang.user?.lang);
        }
        readLang();
    }, []);

    if (!language) {
        return <div>loading...</div>
    }
    let language2 = language;
    return (
        <div id="root">
            <IronManNavBar language={language2} onLanguageChange={setLanguage} />
            <div className="intro" >
                <h1>{t('hello')}</h1>
                <p>{t('test')}</p>
            </div>

        </div>
    )
}

export default App;
