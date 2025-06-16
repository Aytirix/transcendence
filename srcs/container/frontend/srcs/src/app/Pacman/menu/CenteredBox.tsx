import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import WaitingRooms from './WaitingRooms';
import ActiveRooms from './ActiveRooms';
import Rules from './Rules';
import Statistics from './Statistics';
import Maps from './Maps';
import { state, PacmanMap } from '../../types/pacmanTypes';
import '../../assets/styles/pacman/CenteredBox.scss';
import { Link, useNavigate } from 'react-router-dom';


const TABS = [
	{ id: 'WaitingRooms', label: 'Lobby' },
	{ id: 'ActiveRooms', label: 'En direct' },
	{ id: 'Rules', label: 'Règles' },
	{ id: 'Statistics', label: 'Statistique' },
	{ id: 'Maps', label: 'Carte' },
];

interface CenteredBoxProps {
	state: state;
	onCreateMap?: () => void;
	onEditMap?: (map: PacmanMap) => void; // Ajouter cette prop
}

export const CenteredBox: React.FC<CenteredBoxProps> = ({ state, onCreateMap, onEditMap }) => {
	const [currentPage, setCurrentPage] = useState<string>('WaitingRooms');
	const navigate = useNavigate();
	
	return (
		<>
			<div className='home-button'>
				<button
					className="home-icon-btn"
					onClick={async () => {navigate('/');}}
					aria-label="Retour à l'accueil"
					title="Retour à l'accueil"
				>
					<img src="/avatars/ironman.svg" alt="Iron Man home icon" />
					<span className="home-label">Accueil</span>
				</button>
			</div>
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
									Statistics: <Statistics />,
									Rules: <Rules />,
									Maps: <Maps onCreateMap={onCreateMap} onEditMap={onEditMap} state={state} />,
								}[currentPage] || <p>Page non trouvée</p>}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</>
	)
};

export default CenteredBox;
