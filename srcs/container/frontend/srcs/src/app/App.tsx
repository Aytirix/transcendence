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
// import './assets/styles/App.scss';
import { useLanguage } from '../contexts/LanguageContext';

function App() {
    const { t, setLanguage, language } = useLanguage();

    return (
        <div id="root">
            <IronManNavBar language={language} onLanguageChange={setLanguage} />
            <h1>{t('hello')}</h1>
			<p>{t('test')}</p>
            {/* Tes autres routes/pages ici */}
        </div>
    )
}

export default App;
