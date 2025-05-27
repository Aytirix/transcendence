import { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Pong } from './pongGame/client'
import WebSocketTest from './WebSocketTest';
import App from './App';
// import GameLauncher from './pongGame/GameLauncher';

// PAGES

// ERROR PAGES

// JEUX

class AppRouter extends Component {

	render() {
		return (
			<Routes>

				<Route>
					<Route path="/" element={<App />} />
					{/* <Route path="/Pong" element={<GameLauncher />} /> */}
					<Route path="/Pong" element={<Pong />} />
					<Route path="/WebSocketTest" element={<WebSocketTest />} />
				</Route>

			</Routes>
		);
	}
}

export default AppRouter;