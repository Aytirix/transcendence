import React from 'react';
import { setMinecraftInfo } from './FullscreenMinecraftHandler';

const Minecraft: React.FC = () => {

	React.useEffect(() => {
		const interval = setInterval(() => {
			setMinecraftInfo();
		}, 30000);

		return () => {
			clearInterval(interval);
			setMinecraftInfo();
		};
	}, []);

	return (
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
				zIndex: 9999,
			}}
		/>
	);
};

export default Minecraft;
