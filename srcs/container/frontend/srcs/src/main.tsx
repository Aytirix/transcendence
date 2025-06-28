import './app/assets/styles/index.css';
import './app/assets/styles/App.scss';
import './i18next/i18next';
import { createRoot } from 'react-dom/client';
import SingletonGuard from './app/components/SingleWindowGuard.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/AppRouter.tsx';
import { ToastPortalContainer } from './app/components/Notifications';
import IronManNavBar from './app/IronManNavBar';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';
import { ChatWebSocketProvider } from './app/chat/ChatWebSocketContext';

function DisableNativeContextMenu({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			e.preventDefault();
		};
		window.addEventListener('contextmenu', handler);
		localStorage.setItem('getMinecraftInfo?', 'false');
		return () => window.removeEventListener('contextmenu', handler);
	}, []);

	return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
	<DisableNativeContextMenu>
		<ToastPortalContainer />
		<ChatWebSocketProvider>
			<BrowserRouter>
				<SingletonGuard>
					<LanguageProvider>
						<AuthProvider>
							<IronManNavBar />
							<AppRouter />
						</AuthProvider>
					</LanguageProvider>
				</SingletonGuard>
			</BrowserRouter>
			<ToastPortalContainer />
		</ChatWebSocketProvider>
	</DisableNativeContextMenu>
);
