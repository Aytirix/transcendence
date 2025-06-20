import { useNavigate } from "react-router-dom";
import { Solo } from "./modes/Solo";
import { MultiPlayers } from "./modes/MultiPlayers";
import { Tournament } from "./modes/Tournament";

const GameMenu: React.FC = () => {
	const navigate = useNavigate();

	const SameKeyboard = () => { navigate('/Pong/menu/SameKeyboard'); };
	return (
		<>
			<div className="video-wrapper">
				<video
				className="bg-video"
				autoPlay
				muted
				loop
				disablePictureInPicture
				controlsList="nodownload noplaybackrate nofullscreen"
				>
				<source src="/images/menuPagevids.mp4" type="video/mp4" />
				</video>
			</div>

				<div className='page-menu-custom'>
					<button className="Menu-button" onClick={SameKeyboard}>SameKeyboard</button>
					<button className="Menu-button" onClick={Solo}>Solo</button>
					<button className="Menu-button" onClick={MultiPlayers}>Multi Players</button>
					<button className="Menu-button" onClick={Tournament}>Tournament</button>
				</div>
		</>
	);
};

export default GameMenu;