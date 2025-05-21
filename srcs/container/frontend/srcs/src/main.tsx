import './i18next/i18next';
import { createRoot } from 'react-dom/client';
import SingletonGuard from './app/components/SingleWindowGuard.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/AppRouter.tsx';
import { ToastContainer } from './app/components/Notifications';

import { AuthProvider } from './contexts/AuthContext';
import './app/assets/styles/Star.scss';
import './app/assets/styles/index.css';
import { useEffect } from 'react';

function DisableNativeContextMenu({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			e.preventDefault(); // bloque le menu natif
		};
		window.addEventListener('contextmenu', handler);
		return () => window.removeEventListener('contextmenu', handler);
	}, []);

	return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
	<DisableNativeContextMenu>
		<ToastContainer />
		<SingletonGuard>
			<BrowserRouter>
				<LanguageProvider>
					<AuthProvider>
						<AppRouter />
					</AuthProvider>
				</LanguageProvider>
			</BrowserRouter>
		</SingletonGuard>
	</DisableNativeContextMenu>
);
