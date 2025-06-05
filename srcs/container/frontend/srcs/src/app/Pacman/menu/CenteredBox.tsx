import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import WaitingRooms from './WaitingRooms';
import ActiveRooms from './ActiveRooms';
import Rules from './Rules';
import Maps from './Maps'; // Adjusted the path to point to the correct location
/* import Settings from './Settings'; */
/* import Statistics from './Statistics'; */
import { state, PacmanMap } from '../../types/pacmanTypes';
// import '@styles/pacman/CenteredBox.scss';
import '../../assets/styles/pacman/CenteredBox.scss';

const TABS = [
	{ id: 'WaitingRooms', label: 'Lobby' },
	{ id: 'ActiveRooms', label: 'En direct' },
	{ id: 'Rules', label: 'Règles' },
	{ id: 'Maps', label: 'Carte' },
	/* { id: 'Statistics', label: 'Statistiques' }, */
	/* { id: 'Settings', label: 'Paramètres' }, */
];

interface CenteredBoxProps {
	state: state;
	onCreateMap?: () => void;
	onEditMap?: (map: PacmanMap) => void; // Ajouter cette prop
}

export const CenteredBox: React.FC<CenteredBoxProps> = ({ state, onCreateMap, onEditMap }) => {
	const [currentPage, setCurrentPage] = useState<string>('WaitingRooms');

	return (
		<div className="centered-box">
			<div className='title-container'>
				<h1>PACMAN</h1>
			</div>
			{/* Conteneur Principal */}
			<div className="main-content">
				{/* Colonne gauche - Menu */}
				<div className='menu-column'>
					{TABS.map((tab) => (
						<button
							key={tab.id}
							className={`menu-button ${currentPage === tab.id ? 'selected' : ''}`}
							onClick={() => setCurrentPage(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>
				{/* Colonne droite - Contenu */}
				<div className='content-column'>
					<AnimatePresence mode="wait">
						<motion.div
							key={currentPage}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ duration: 0.3 }}
							className="content-wrapper"
						>
							{{
								WaitingRooms: <WaitingRooms state={state} />,
								ActiveRooms: <ActiveRooms state={state} />,
								Rules: <Rules />,
								Maps: <Maps onCreateMap={onCreateMap} onEditMap={onEditMap} state={state} />,
								/* Settings: <Settings />, */
								/* Statistics: <Statistics />, */
							}[currentPage] || <p>Page non trouvée</p>}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
			{/* Add a button for creating maps */}
			{/* {onCreateMap && (
				<button 
					className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
					onClick={onCreateMap}
				>
					Create Custom Map
				</button>
			)} */}
		</div>
	)
};

export default CenteredBox;
