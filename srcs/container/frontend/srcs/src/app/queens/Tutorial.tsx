import React, { useState, useEffect } from 'react';
import './Tutorial.css';

interface TutorialStep {
	id: number;
	title: string;
	content: string;
	target?: string;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
	action?: () => void;
}

export interface GameSettings {
	board_size: number;
	difficultyLevel: number;
	autoCross: boolean;
	view_tutorial: number; // 0: non vu, 1: vu
}

interface TutorialProps {
	gameSettings: GameSettings;
	updateParameters: (params: Partial<GameSettings>) => void;
}

const Tutorial: React.FC<TutorialProps> = ({ gameSettings, updateParameters }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [showOverlay, setShowOverlay] = useState(false);

	// Déterminer si le tutoriel doit être affiché
	const shouldShowTutorial = gameSettings.view_tutorial === 0;

	const steps: TutorialStep[] = [
		{
			id: 1,
			title: "Bienvenue dans Queens ! 👑",
			target: '',
			content: "Queens est une variante du célèbre problème des N reines. Laissez-moi vous expliquer comment jouer !",
			position: 'center'
		},
		{
			id: 2,
			title: "La grille de jeu",
			content: "Voici votre plateau de jeu. C'est une grille de 9x9 cases divisée en régions colorées. Chaque couleur représente une région distincte.",
			target: '#board',
			position: 'right'
		},
		{
			id: 3,
			title: "Les régions colorées",
			content: "Observez bien les différentes couleurs. Chaque région colorée peut contenir exactement UNE reine - pas plus, pas moins !",
			target: '#board',
			position: 'right'
		},
		{
			id: 4,
			title: "Objectif du jeu 🎯",
			content: "Votre mission : placer exactement 9 reines sur la grille (où 9 est la taille de la grille). Une reine par région colorée.",
			target: '#board',
			position: 'right'
		},
		{
			id: 5,
			title: "Règle n°1 : Pas d'attaque ! ⚔️",
			content: "Les reines ne peuvent pas s'attaquer entre elles. Cela signifie : pas deux reines sur la même ligne, colonne ou diagonale.",
			target: '#board',
			position: 'right'
		},
		{
			id: 6,
			title: "Règle n°2 : Pas de voisinage ! 🚫",
			content: "Une reine ne peut pas être placée dans une case adjacente à une autre reine.",
			target: '#board',
			position: 'right'
		},
		{
			id: 7,
			title: "Règle n°3 : Une reine par couleur ! 🌈",
			content: "Chaque région colorée ne peut contenir qu'une seule reine. C'est ce qui rend ce jeu unique !",
			target: '#board',
			position: 'right'
		},
		{
			id: 8,
			title: "Comment jouer ? 🎮",
			content: "Premier clic : place une croix (marquage). Deuxième clic : place une reine. Troisième clic : case vide.",
			target: '#board',
			position: 'right'
		},
		{
			id: 9,
			title: "Les aides disponibles 🛠️",
			content: "Utilisez les boutons 'Indice' pour obtenir de l'aide, 'Retour' pour annuler un coup, ou 'Afficher solution' si vous êtes bloqué.",
			target: '#btn-action',
			position: 'bottom'
		},
		{
			id: 10,
			title: "À vous de jouer ! 🚀",
			content: "Vous connaissez maintenant toutes les règles. Placez vos reines stratégiquement et amusez-vous bien !",
			position: 'center'
		}
	];

	useEffect(() => {
		if (shouldShowTutorial) {
			setShowOverlay(true);
			setCurrentStep(0);
		} else {
			setShowOverlay(false);
		}
	}, [shouldShowTutorial]);

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			completeTutorial();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const completeTutorial = () => {
		setShowOverlay(false);
		// Marquer le tutoriel comme vu
		updateParameters({ view_tutorial: 1 });
	};

	const skipTutorial = () => {
		setShowOverlay(false);
		// Marquer le tutoriel comme vu
		updateParameters({ view_tutorial: 1 });
	};

	const getSpotlightStyle = (target: string) => {
		const element = document.querySelector(target);
		if (!element) return {};

		const rect = element.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		return {
			position: 'absolute' as const,
			top: rect.top + scrollTop - 8,
			left: rect.left + scrollLeft - 8,
			width: rect.width + 16,
			height: rect.height + 16,
			borderRadius: '8px',
			pointerEvents: 'none' as const,
			zIndex: 9999
		};
	};

	const getBackdropStyle = (target: string) => {
		const element = document.querySelector(target);
		if (!element) return {};

		const rect = element.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		// Position du trou
		const holeLeft = rect.left + scrollLeft - 8;
		const holeTop = rect.top + scrollTop - 8;
		const holeWidth = rect.width + 16;
		const holeHeight = rect.height + 16;

		// Créer un box-shadow qui couvre tout l'écran sauf le trou
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const shadowSize = Math.max(viewportWidth, viewportHeight) * 2;

		return {
			position: 'absolute' as const,
			top: holeTop,
			left: holeLeft,
			width: holeWidth,
			height: holeHeight,
			borderRadius: '8px',
			boxShadow: `0 0 0 ${shadowSize}px rgba(0, 0, 0, 0.8)`,
			pointerEvents: 'none' as const
		};
	};

	const getCurrentStepData = () => steps[currentStep];

	const getTooltipPosition = (target: string, position: string) => {
		const element = document.querySelector(target);
		if (!element) return { top: '50%', left: '50%' };

		const rect = element.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		// Positions absolues par rapport au document
		const elementTop = rect.top + scrollTop;
		const elementLeft = rect.left + scrollLeft;

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				// Le bas de la carte doit être aligné avec le haut de l'élément
				top = elementTop - 20;
				left = elementLeft + (rect.width / 2);
				break;
			case 'bottom':
				// Le haut de la carte doit être aligné avec le bas de l'élément
				top = elementTop + rect.height + 20;
				left = elementLeft + (rect.width / 2);
				break;
			case 'left':
				// Le côté droit de la carte doit être aligné avec le côté gauche de l'élément
				top = elementTop + (rect.height / 2);
				left = elementLeft - 20;
				break;
			case 'right':
				// Le côté gauche de la carte doit être aligné avec le côté droit de l'élément
				top = elementTop + (rect.height / 2);
				left = elementLeft + rect.width + 20;
				break;
			default:
				top = window.innerHeight / 2 + scrollTop;
				left = window.innerWidth / 2 + scrollLeft;
		}

		return { top: `${top}px`, left: `${left}px` };
	};

	if (!showOverlay || !shouldShowTutorial) return null;

	const step = getCurrentStepData();
	const position = step.target ? getTooltipPosition(step.target, step.position || 'bottom') : { top: '50%', left: '50%' };

	return (
		<div className="tutorial-overlay">
			{/* Overlay avec trou pour l'élément ciblé OU fond noir complet */}
			{step.target ? (
				<div
					className="tutorial-backdrop-with-hole"
					style={getBackdropStyle(step.target)}
					onClick={skipTutorial}
				/>
			) : (
				<div
					className="tutorial-backdrop-full"
					onClick={skipTutorial}
				/>
			)}

			{/* Spotlight sur l'élément ciblé */}
			{step.target && (
				<div
					className="tutorial-spotlight-element"
					style={getSpotlightStyle(step.target)}
				/>
			)}

			{/* Tooltip avec le contenu de l'étape */}
			<div
				className="tutorial-tooltip"
				data-position={step.position || 'center'}
				style={{
					position: 'fixed',
					top: position.top,
					left: position.left,
					zIndex: 10000
				}}
			>
				<div className="tutorial-content">
					<h3>{step.title}</h3>
					<p>{step.content}</p>

					<div className="tutorial-actions">
						<div className="step-counter">
							{currentStep + 1} / {steps.length}
						</div>

						<div className="tutorial-buttons">
							<button
								className="tutorial-btn tutorial-btn-secondary"
								onClick={skipTutorial}
							>
								Passer
							</button>

							{currentStep > 0 && (
								<button
									className="tutorial-btn tutorial-btn-secondary"
									onClick={prevStep}
								>
									Précédent
								</button>
							)}

							<button
								className="tutorial-btn tutorial-btn-primary"
								onClick={nextStep}
							>
								{currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Tutorial;
