import React, { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const CHANNEL_NAME = 'Trascendence';
const APP_WINDOW_NAME = 'TrascendenceApp';
const IGNORE_PATH = ['/auth/checkCode', '/login', '/register', '/forget-password', '/api/docs', '/module-manager'];

type Message = 'HELLO' | 'OCCUPIED' | 'FOCUS';

interface SingletonGuardProps {
	children?: ReactNode;
}

const SingletonGuard: React.FC<SingletonGuardProps> = ({ children }) => {
	const [isPrimary, setIsPrimary] = useState<boolean | null>(null);
	const [channel] = useState(() => new BroadcastChannel(CHANNEL_NAME));
	const location = useLocation();
	const ignored = IGNORE_PATH.includes(location.pathname);
	const { t } = useLanguage();

	useEffect(() => {
		window.name = APP_WINDOW_NAME;

		let localIsPrimary = true;
		let decisionTaken = false;

		channel.onmessage = (ev: MessageEvent<Message>) => {
			switch (ev.data) {
				case 'HELLO':
					if (localIsPrimary && decisionTaken && !ignored) {
						channel.postMessage('OCCUPIED');
					}
					break;
				case 'OCCUPIED':
					if (!decisionTaken && !ignored) {
						localIsPrimary = false;
						setIsPrimary(false);
						decisionTaken = true;
					}
					break;
				case 'FOCUS':
					if (localIsPrimary && !ignored) {
						window.focus();
					}
					break;
			}
		};

		if (!ignored) {
			channel.postMessage('HELLO');
		}

		const to = setTimeout(() => {
			if (!decisionTaken) {
				setIsPrimary(localIsPrimary);
				decisionTaken = true;
			}
		}, 300);

		return () => {
			clearTimeout(to);
			channel.close();
		};
	}, [channel]);

	if (ignored) {
		return <>{children}</>;
	}

	if (isPrimary === null) return null;

	if (!isPrimary) {
		return (
			<div className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
				{/* Décorations flottantes animées */}
				<div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
					<div className="absolute left-1/4 top-1/4 animate-bounce-slow text-6xl opacity-20 select-none">⚠️</div>
					<div className="absolute right-1/3 top-1/3 animate-float text-5xl opacity-15 select-none">🚫</div>
					<div className="absolute right-1/4 bottom-1/3 animate-bounce-slow text-4xl opacity-10 select-none">🖥️</div>
					<div className="absolute left-1/3 bottom-1/4 animate-float text-3xl opacity-20 select-none">⭐</div>
					<div className="absolute right-1/2 top-1/5 animate-pulse text-2xl opacity-15 select-none">💫</div>
				</div>

				<div className="z-10 w-full max-w-lg">
					<div className="bg-gray-900 bg-opacity-90 border border-gray-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
						{/* Icône principale avec animation */}
						<div className="relative">
							<div className="w-24 h-24 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-red-500 ring-opacity-30 animate-pulse">
								<span className="text-4xl text-white">⚠️</span>
							</div>
							<div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
						</div>

						{/* Titre avec effet gradient */}
						<h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-red-500 tracking-widest mb-2">
							{t('singlePage.title')}
						</h1>

						{/* Message principal */}
						<div className="text-center">
							<p className="text-gray-300 text-lg leading-relaxed mb-4">
								{t('singlePage.message')}
							</p>
							<p className="text-gray-400 text-sm">
								{t('singlePage.instruction')}
							</p>
						</div>

						{/* Indicateur décoratif */}
						<div className="flex gap-2 mt-2">
							<div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
							<div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-150"></div>
							<div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-300"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};
export default SingletonGuard;