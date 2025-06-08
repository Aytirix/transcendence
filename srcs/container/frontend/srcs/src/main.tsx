import './i18next/i18next';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import AppRouter from './app/AppRouter.tsx';
import { ToastContainer } from './app/components/Notifications';
import IronManNavBar from './app/IronManNavBar';
import { AuthProvider } from './contexts/AuthContext';
// import './app/assets/styles/Star.scss';
import './app/assets/styles/index.css';
// import './app/assets/styles/IronManTheme.css';
// import './app/assets/styles/IronManNavBar.css';
import { useEffect } from 'react';

// function DisableNativeContextMenu({ children }: { children: React.ReactNode }) {
// 	useEffect(() => {
// 		const handler = (e: MouseEvent) => {
// 			e.preventDefault(); // bloque le menu natif
// 		};
// 		window.addEventListener('contextmenu', handler);
// 		return () => window.removeEventListener('contextmenu', handler);
// 	}, []);

// 	return <>{children}</>;
// }

createRoot(document.getElementById('root')!).render(
	// <DisableNativeContextMenu>
	<SingletonGuard>
			<ToastContainer />
			<BrowserRouter>
				<LanguageProvider>
					<AuthProvider>
						<IronManNavBar />
						<AppRouter />
					</AuthProvider>
				</LanguageProvider>
			</BrowserRouter>
	</SingletonGuard>
	// </DisableNativeContextMenu>
);
