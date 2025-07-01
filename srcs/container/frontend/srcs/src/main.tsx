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
import { ChatWebSocketProvider, useChatWebSocket } from './app/chat/ChatWebSocketContext';
import { NavigationBridge } from './app/components/NavigationBridge';

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

function AppContent() {
	const { setNavigateFunction, setLocationFunction } = useChatWebSocket();

	return (
		<NavigationBridge onNavigateReady={setNavigateFunction} onLocationReady={setLocationFunction}>
			<SingletonGuard>
				<LanguageProvider>
					<AuthProvider>
						<IronManNavBar />
						<AppRouter />
					</AuthProvider>
				</LanguageProvider>
			</SingletonGuard>
		</NavigationBridge>
	);
}

createRoot(document.getElementById('root')!).render(
	<DisableNativeContextMenu>
		<ToastPortalContainer />
		<ChatWebSocketProvider>
			<BrowserRouter>
				<AppContent />
			</BrowserRouter>
			<ToastPortalContainer />
		</ChatWebSocketProvider>
	</DisableNativeContextMenu>
);
