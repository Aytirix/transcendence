import { useCallback, useEffect } from 'react';

interface UseKeyboardControlsProps {
	ws: WebSocket | null;
	onFirstInteraction: () => Promise<void>;
}

export function useKeyboardControls({ ws, onFirstInteraction }: UseKeyboardControlsProps) {
	const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;

		// Activer l'audio au premier appui de touche
		await onFirstInteraction();

		const keyActions: Record<string, string> = {
			'ArrowUp': 'UP',
			'ArrowDown': 'DOWN',
			'ArrowLeft': 'LEFT',
			'ArrowRight': 'RIGHT'
		};

		const direction = keyActions[event.key];
		if (direction) {
			ws.send(JSON.stringify({
				action: 'playerMove',
				direction: direction
			}));
			event.preventDefault();
		}
	}, [ws, onFirstInteraction]);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);
}
