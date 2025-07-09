import { useEffect, useRef } from 'react';
import notification from '../app/components/Notifications';


const url = `wss://${window.location.host}/api`;

export type WebSocketStatus = 'Connecting...' | 'Connected' | 'Closed' | 'Error' | 'Reconnecting';

export interface SafeWebSocketProps {
	endpoint: string | null;
	onMessage: (data: any, socket: WebSocket) => void;
	onStatusChange?: (status: WebSocketStatus) => void;
	reconnectDelay?: number;  // en ms, ex: 3000ms = 3 secondes
	maxReconnectAttempts?: number; // Nombre maximum de tentatives de reconnexion
	pingInterval?: number; // Délai entre les ping, en ms
}

export function useSafeWebSocket({ endpoint, onMessage, onStatusChange, reconnectDelay = 10000, maxReconnectAttempts = 1, pingInterval = 50000 }: SafeWebSocketProps): WebSocket | null {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const isManuallyClosed = useRef(false);

	const setupWebSocket = () => {
		if (!endpoint) return;

		if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING || reconnectAttemptsRef.current >= maxReconnectAttempts) {
			return;
		}

		const wsUrl = `${url}${endpoint}`;
		const socket = new WebSocket(wsUrl);
		socketRef.current = socket;
		onStatusChange?.('Connecting...');

		socket.onopen = () => {
			// reconnectAttemptsRef.current = 0;
			onStatusChange?.('Connected');
			heartbeatRef.current = setInterval(() => {
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify({ action: 'ping' }));
				}
			}, pingInterval);
		};

		socket.onmessage = (evt) => {
			try {
				const data = JSON.parse(evt.data);
				if (data.result === 'error' && data.notification) {
					if (!Array.isArray(data.notification)) {
						notification.error(data.notification);
					} else if (data.notification.length > 0) {
						for (const message of data.notification) {
							notification.error(message);
						}
					}
					return;
				} else if (data.result !== 'error' && data.notification) {
					if (!Array.isArray(data.notification)) {
						notification.success(data.notification);
					} else if (data.notification.length > 0) {
						for (const message of data.notification) {
							notification.success(message);
						}
					}
				}
				onMessage(data, socket);
			} catch {
				console.error('WS parse error :', evt.data);
			}
		};

		socket.onclose = () => {
			handleCloseOrError('Closed');
		};

		socket.onerror = (error) => {
			console.error('WebSocket error:', error, 'URL:', wsUrl);
			handleCloseOrError('Error');
		};
	};

	const handleCloseOrError = (type: 'Closed' | 'Error') => {
		clearInterval(heartbeatRef.current!);
		if (isManuallyClosed.current) return;

		if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
			onStatusChange?.(type);
		} else {
			onStatusChange?.('Reconnecting');
			reconnectAttemptsRef.current++;
			reconnectTimeoutRef.current = setTimeout(setupWebSocket, reconnectDelay);
		}
	};

	useEffect(() => {
		setupWebSocket();
		window.addEventListener('beforeunload', () => {
			isManuallyClosed.current = true;
			clearInterval(heartbeatRef.current!);
			socketRef.current?.close();
		});
		return () => {
			isManuallyClosed.current = true;
			clearInterval(heartbeatRef.current!);
			reconnectTimeoutRef.current && clearTimeout(reconnectTimeoutRef.current);
			socketRef.current?.close();
			window.removeEventListener('beforeunload', () => { });
		};
	}, [endpoint]);

	return socketRef.current;
}

export default useSafeWebSocket;