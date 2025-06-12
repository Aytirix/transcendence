import { Component } from 'react';
import { Routes, Route } from 'react-router-dom';


// import WebSocketTest from './users/WebSocketTest';
import Chat from './UserTest';
import { Pong } from './pongGame/client'
import GameMenu from './pongGame/GameMenu';
import WebSocketPacman from './Pacman/Init'
import App from './App';
import SameKeyboard from './pongGame/SameKeyboard';

import IronManProfile from './IronManProfile';
import IronManLogin from './IronManLogin';
import IronManRegister from './IronManRegister';
import ChatPage from './chat/ChatPage';

// PAGES

// ERROR PAGES

// JEUX

class AppRouter extends Component {

	render() {
		return (
			<Routes>

				<Route>
					<Route path="/" element={<App />} />
					<Route path="/profile" element={<IronManProfile />} />
					<Route path="/login" element={<IronManLogin />} />
					<Route path="/chat" element={<ChatPage />} />
					<Route path="/register" element={<IronManRegister />} />
					<Route path="/pong" element={<Pong />} />
					<Route path="/pong/menu" element={<GameMenu />} />
					<Route path="/pong/menu/SameKeyboard" element={<SameKeyboard />} />
					<Route path="/Pacman" element={<WebSocketPacman />} />
					<Route path="/userTest" element={<Chat />} />
				</Route>

			</Routes>
		);
	}
}

export default AppRouter;