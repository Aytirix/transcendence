import React from 'react';
import FullscreenMinecraftHandler, { setMinecraftInfo } from './FullscreenMinecraftHandler';
import notification from '../Notifications';

const Minecraft: React.FC = () => {

	React.useEffect(() => {
		const interval = setInterval(() => {
			setMinecraftInfo();
		}, 10 * 60 * 1000); // 10 minutes

		return () => {
			clearInterval(interval);
			setMinecraftInfo();
			notification.dismiss('minecraft-storage-size');
		};
	}, []);

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
			/>
		</FullscreenMinecraftHandler>
	);
};

export default Minecraft;
