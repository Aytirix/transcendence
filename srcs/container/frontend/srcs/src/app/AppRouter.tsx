import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


// import WebSocketTest from './users/WebSocketTest';
import { Pong } from './pongGame/client'
import GameMenu from './pongGame/GameMenu';
import WebSocketPacman from './Pacman/Init'
import App from './App';
import SameKeyboard from './pongGame/SameKeyboard';
import Credits from './Credits';

import IronManProfile from './IronManProfile';
import IronManLogin from './IronManLogin';
import IronManRegister from './IronManRegister';
import GroupChatPage from './chat/GroupChatPage';
import CheckRedirectEmail from './CheckRedirectEmail';
import FriendPage from './chat/FriendPage';
import IronManForgetPass from './IronManForgetPass';
import MinSizeGuard from './components/MinSizeGuard';

// PAGES

// ERROR PAGES

// JEUX

class AppRouter extends Component {

	render() {
		return (
			<Routes>

				<Route>
					<Route path="/" element={<App />} />
					<Route path="/credits" element={<Credits />} />
					<Route path="/profile" element={<IronManProfile />} />
					<Route path="/login" element={<IronManLogin />} />
					<Route path="/forget-password" element={<IronManForgetPass />} />
					<Route path="/chat" element={<GroupChatPage />} />
					<Route path="/friend" element={<FriendPage />} />
					<Route path="/register" element={<IronManRegister />} />
					<Route path="/Pong" element={
						<MinSizeGuard minWidth={1200} minHeight={870} message="Écran trop petit">
							<Pong />
						</MinSizeGuard>
					} />
					<Route path="/Pong/menu" element={
						<MinSizeGuard minWidth={1200} minHeight={870} message="Écran trop petit">
							<GameMenu />
						</MinSizeGuard>
					} />
					<Route path="/Pong/menu/SameKeyboard" element={
						<MinSizeGuard minWidth={1200} minHeight={870} message="Écran trop petit">
							<SameKeyboard />
						</MinSizeGuard>
					} />
					<Route path="/Pacman" element={
						<MinSizeGuard minWidth={1200} minHeight={870} message="Écran trop petit">
							<WebSocketPacman />
						</MinSizeGuard>
					} />

					{/* Route Redirection email */}
					<Route path="/auth/checkCode" element={<CheckRedirectEmail />} />

					{/* Route de redirection par défaut */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Routes>
		);
	}
}

export default AppRouter;