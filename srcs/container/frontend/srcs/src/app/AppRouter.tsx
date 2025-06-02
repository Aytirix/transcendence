import { Component } from 'react';
import { Routes, Route } from 'react-router-dom';


// import WebSocketTest from './users/WebSocketTest';
import Chat from './UserTest';
import { Pong } from './pongGame/client'
import WebSocketPacman from './Pacman/Init'
import ModuleManager from './ModuleManager';
import App from './App';
import IronManProfile from './IronManProfile';
import IronManLogin from './IronManLogin';
import IronManRegister from './IronManRegister';

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
					<Route path="/register" element={<IronManRegister />} />
					<Route path="/pong" element={<Pong />} />
					<Route path="/Pacman" element={<WebSocketPacman />} />
					<Route path="/userTest" element={<Chat />} />
					<Route path="/ModuleManager" element={<ModuleManager />} />
				</Route>

			</Routes>
		);
	}
}

export default AppRouter;