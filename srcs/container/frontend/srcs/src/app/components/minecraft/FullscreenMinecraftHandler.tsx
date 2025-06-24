import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recordMinecraftAccess, canAccessMinecraft } from './minecraftUtils';

interface FullscreenMinecraftHandlerProps {
	children: React.ReactNode;
}

export default function FullscreenMinecraftHandler({ children }: FullscreenMinecraftHandlerProps) {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'F4') {
				// Vérifier si on est sur la page d'accueil ou minecraft
				const currentPath = location.pathname;
				if (currentPath === '/') {
					e.preventDefault();

					// Vérifier la limitation temporelle
					const canAccess = canAccessMinecraft();
					if (!canAccess) {
						return;
					}

					// Enregistrer l'accès
					recordMinecraftAccess();

					// if (!document.fullscreenElement) {
					// 	document.documentElement.requestFullscreen().catch((err) => {
					// 		console.warn('Impossible de passer en plein écran:', err);
					// 	});
					// }
					navigate('/minecraft');
				} else if (currentPath === '/minecraft') {
					e.preventDefault();
					// if (document.fullscreenElement) {
					// 	document.exitFullscreen().catch((err) => {
					// 		console.warn('Impossible de sortir du plein écran:', err);
					// 	});
					// }
					navigate('/');
				}
			}
		};

		// Ajouter l'écouteur d'événement sur window ET sur document
		// pour capturer les événements même depuis les iframes
		window.addEventListener('keydown', handleKeyDown, true); // capture phase
		document.addEventListener('keydown', handleKeyDown, true);

		// Écouter également les messages depuis l'iframe minecraft
		const handleMessage = (event: MessageEvent) => {
			if (!event.data) return;
			if (event.data.type === 'minecraft-f4') {
				// enlever le plein écran et aller à l'accueil
				const syntheticEvent = new KeyboardEvent('keydown', { key: 'F4' });
				handleKeyDown(syntheticEvent);
			}
		};


		window.addEventListener('message', handleMessage);

		// Nettoyer les écouteurs lors du démontage
		return () => {
			window.removeEventListener('keydown', handleKeyDown, true);
			document.removeEventListener('keydown', handleKeyDown, true);
			window.removeEventListener('message', handleMessage);
		};
	}, [navigate, location]);

	return <>{children}</>;
}
