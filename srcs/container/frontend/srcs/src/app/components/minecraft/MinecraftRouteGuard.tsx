import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasRecentAccess } from './minecraftUtils';

interface MinecraftRouteGuardProps {
	children: React.ReactNode;
}

export default function MinecraftRouteGuard({ children }: MinecraftRouteGuardProps) {
	const navigate = useNavigate();

	useEffect(() => {
		// Vérifier si l'utilisateur a accédé récemment via F4
		if (!hasRecentAccess()) {
			navigate('/', { replace: true });
			return;
		}
	}, [navigate]);

	return <>{children}</>;
}
