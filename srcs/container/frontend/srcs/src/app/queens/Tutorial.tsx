import React, { useState, useEffect } from 'react';
import './assets/styles/Tutorial.scss';
import { useLanguage } from '../../contexts/LanguageContext';

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
	const [firstCardRender, setFirstCardRender] = useState(0);
	const [showOverlay, setShowOverlay] = useState(false);
	const [tooltipVisible, setTooltipVisible] = useState(false);
	const [forceUpdate, setForceUpdate] = useState(0);
	const { t } = useLanguage();

	// Déterminer si le tutoriel doit être affiché
	const shouldShowTutorial = gameSettings.view_tutorial === 0;

	const steps: TutorialStep[] = [
		{
			id: 1,
			title: t('queens.tutorial.step1.title'),
			target: '',
			content: t('queens.tutorial.step1.content'),
			position: 'center'
		},
		{
			id: 2,
			title: t('queens.tutorial.step2.title'),
			content: t('queens.tutorial.step2.content'),
			target: '#board',
			position: 'right'
		},
		{
			id: 3,
			title: t('queens.tutorial.step3.title'),
			content: t('queens.tutorial.step3.content'),
			target: '#board',
			position: 'left'
		},
		{
			id: 4,
			title: t('queens.tutorial.step4.title'),
			content: t('queens.tutorial.step4.content'),
			target: '#board',
			position: 'left'
		},
		{
			id: 5,
			title: t('queens.tutorial.step5.title'),
			content: t('queens.tutorial.step5.content'),
			target: '#board',
			position: 'left'
		},
		{
			id: 6,
			title: t('queens.tutorial.step6.title'),
			content: t('queens.tutorial.step6.content'),
			target: '#board',
			position: 'left'
		},
		{
			id: 7,
			title: t('queens.tutorial.step7.title'),
			content: t('queens.tutorial.step7.content'),
			target: '#btn-action',
			position: 'bottom'
		},
		{
			id: 8,
			title: t('queens.tutorial.step8.title'),
			content: t('queens.tutorial.step8.content'),
			position: 'center'
		}
	];

	useEffect(() => {
		if (shouldShowTutorial) {
			setShowOverlay(true);
			setCurrentStep(0);
			setTooltipVisible(false);
		} else {
			setShowOverlay(false);
		}
	}, [shouldShowTutorial]);

	// Effet pour gérer la visibilité de la tooltip après changement d'étape
	useEffect(() => {
		if (showOverlay && !firstCardRender) {
			setTooltipVisible(false);
			setFirstCardRender(1);
			// Petit délai pour permettre le calcul de la position
			const timer = setTimeout(() => {
				setTooltipVisible(true);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [currentStep, showOverlay]);

	// Effet pour gérer le redimensionnement de la fenêtre
	useEffect(() => {
		if (!showOverlay) return;

		const handleResize = () => {
			// Forcer le re-render pour actualiser les positions
			setForceUpdate(prev => prev + 1);
		};

		const handleOrientationChange = () => {
			// Petit délai pour laisser le temps à l'orientation de changer
			setTimeout(() => {
				setForceUpdate(prev => prev + 1);
			}, 100);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleOrientationChange);

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleOrientationChange);
		};
	}, [showOverlay]);

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
		setFirstCardRender(0);
		setCurrentStep(0);
		setTooltipVisible(false);
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

	const getTooltipPosition = (target: string, position: string): { top: string; left: string; position: string } => {
		const isMobile = window.innerWidth <= 1468;

		// Si pas de target ou position center, retourner des valeurs pour le centrage CSS
		if (!target || position === 'center') {
			return { top: '50%', left: '50%', position: position };
		}

		const element = document.querySelector(target);
		if (!element) return { top: '50%', left: '50%', position: position };

		const rect = element.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		// Positions absolues par rapport au document
		const elementTop = rect.top + scrollTop;
		const elementLeft = rect.left + scrollLeft;

		let top = 0;
		let left = 0;

		const shouldUseTopOnMobile = isMobile && (position === 'left' || position === 'right');

		const finalPosition = shouldUseTopOnMobile ? 'top' : position;

		switch (finalPosition) {
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

		return { top: `${top}px`, left: `${left}px`, position: finalPosition };
	};

	if (!showOverlay || !shouldShowTutorial) return null;

	const step = getCurrentStepData();
	const res = getTooltipPosition(step.target || '', step.position || 'center');
	const position = {
		top: res.top,
		left: res.left,
	};
	const finalPosition = res.position;

	return (
		<div className="tutorial-overlay">
			{/* Overlay avec trou pour l'élément ciblé OU fond noir complet */}
			{step.target ? (
				<div
					className="tutorial-backdrop-with-hole"
					style={getBackdropStyle(step.target)}
				/>
			) : (
				<div
					className="tutorial-backdrop-full"
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
				data-position={finalPosition}
				style={{
					position: 'fixed',
					top: position.top,
					left: position.left,
					zIndex: 10000,
					visibility: tooltipVisible ? 'visible' : 'hidden',
					opacity: tooltipVisible ? 1 : 0,
				}}
			>
				<div className="tutorial-content">
					<h3>{step.title}</h3>
					<p style={{ whiteSpace: 'pre-line' }}>{step.content}</p>

					<div className="tutorial-actions">
						<div className="step-counter">
							{currentStep + 1} / {steps.length}
						</div>

						<div className="tutorial-buttons">
							<button
								className="tutorial-btn tutorial-btn-secondary"
								onClick={completeTutorial}
							>
								{t('queens.buttons.skip')}
							</button>

							{currentStep > 0 && (
								<button
									className="tutorial-btn tutorial-btn-secondary"
									onClick={prevStep}
								>
									{t('queens.buttons.previous')}
								</button>
							)}

							<button
								className="tutorial-btn tutorial-btn-primary"
								onClick={nextStep}
							>
								{currentStep === steps.length - 1 ? t('queens.buttons.finish') : t('queens.buttons.next')}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Tutorial;