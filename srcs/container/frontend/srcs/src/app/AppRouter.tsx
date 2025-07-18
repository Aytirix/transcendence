import { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


// import WebSocketTest from './users/WebSocketTest';
import GameMenu from './pongGame/GameMenu';
import WebSocketPacman from './Pacman/Init'
import Intro from './Intro';
import SameKeyboard from './pongGame/modes/SameKeyboard';
import Credits from './Credits';
import Solo from './pongGame/modes/Solo';
import MultiPlayers from './pongGame/modes/MultiPlayers';
import MultiPlayersInvite from './pongGame/modes/MultiPlayersInvite';
import TournamentPage from './pongGame/modes/Tournament';
import GameTournament from './pongGame/modes/GameTournament';
import WinnerPage from './pongGame/modes/WinnerPage';

import IronManProfile from './IronManProfile';
import IronManLogin from './IronManLogin';
import IronManRegister from './IronManRegister';
import GroupChatPage from './chat/GroupChatPage';
import CheckRedirectEmail from './CheckRedirectEmail';
import FriendPage from './chat/FriendPage';
import IronManForgetPass from './IronManForgetPass';
import MinSizeGuard from './components/MinSizeGuard';
import ModuleManager from './ModuleManager/ModuleManager';
import Minecraft from './minecraft/Minecraft';
import Queens from './queens/solo';
import MinecraftRouteGuard from './minecraft/MinecraftRouteGuard';

class AppRouter extends Component {

	render() {
		return (
			<Routes>

				<Route>
					<Route path="/" element={<Intro />} />
					<Route path="/credits" element={<Credits />} />
					<Route path="/profile" element={<IronManProfile />} />
					<Route path="/login" element={<IronManLogin />} />
					<Route path="/forget-password" element={<IronManForgetPass />} />
					<Route path="/chat" element={<GroupChatPage />} />
					<Route path="/friend" element={<FriendPage />} />
					<Route path="/register" element={<IronManRegister />} />
					<Route path="/minecraft" element={
						<MinecraftRouteGuard>
							<Minecraft />
						</MinecraftRouteGuard>
					} />
					{/* Route pour le jeu Pong */}
					<Route path="/pong" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<GameMenu />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/SameKeyboard" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<SameKeyboard />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/Solo" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<Solo />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/MultiPlayers" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<MultiPlayers />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/MultiPlayersInvite" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<MultiPlayersInvite />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/Tournament" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<TournamentPage />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/GameTournament" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<GameTournament />
						</MinSizeGuard>
					} />
					<Route path="/pong/menu/WinnerPage" element={
						<MinSizeGuard minWidth={1500} minHeight={850} message="Écran trop petit">
							<WinnerPage />
						</MinSizeGuard>
					} />
					{/* Route pour le jeu Pacman */}
					<Route path="/Pacman" element={
						<MinSizeGuard minWidth={1200} minHeight={850} message="Écran trop petit">
							<WebSocketPacman />
						</MinSizeGuard>
					} />

					{/* Route Redirection email */}
					<Route path="/auth/checkCode" element={<CheckRedirectEmail />} />

					{/* Route pour le module de gestion des modules */}
					<Route path="/module-manager" element={
						<MinSizeGuard minWidth={400} minHeight={400} message="Écran trop petit">
							<ModuleManager />
						</MinSizeGuard>
					} />

					{/* Route pour le jeu Queens */}
					<Route path="/queens" element={
						<MinSizeGuard minWidth={0} minHeight={0} message="Écran trop petit">
							<Queens />
						</MinSizeGuard>
					} />

					{/* Route de redirection par défaut */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Routes>
		);
	}
}

export default AppRouter;