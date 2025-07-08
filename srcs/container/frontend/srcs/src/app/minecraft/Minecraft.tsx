import FullscreenMinecraftHandler, { setMinecraftInfo } from './FullscreenMinecraftHandler';
import notification from '../components/Notifications';
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Minecraft: React.FC = () => {
	const { t } = useLanguage();

	React.useEffect(() => {
		const interval = setInterval(() => {
			setMinecraftInfo(t);
		}, 10 * 60 * 1000); // 10 minutes

		return () => {
			clearInterval(interval);
			setMinecraftInfo(t);
			notification.dismiss('minecraft-storage-size');
		};
	}, [t]);

	return (
		<FullscreenMinecraftHandler>
			<iframe
				src="/minecraft.html"
				title="Minecraft"
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					border: 'none',
					margin: 0,
					padding: 0,
					overflow: 'hidden',
					zIndex: 10,
				}}
				// Permettre la capture du focus
				tabIndex={0}
				// Assurer que l'iframe peut recevoir le focus
				allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
			/>
		</FullscreenMinecraftHandler>
	);
};

export default Minecraft;