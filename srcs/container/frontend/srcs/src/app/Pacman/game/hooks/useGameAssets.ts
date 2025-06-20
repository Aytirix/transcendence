import { useMemo } from 'react';

// Import des GIFs de fantômes
import ghostBRightGif from '../../../assets/img/pacman/ghosts/B-right.gif';
import ghostBLeftGif from '../../../assets/img/pacman/ghosts/B-left.gif';
import ghostBUpGif from '../../../assets/img/pacman/ghosts/B-up.gif';
import ghostBDownGif from '../../../assets/img/pacman/ghosts/B-down.gif';

import ghostPRightGif from '../../../assets/img/pacman/ghosts/P-right.gif';
import ghostPLeftGif from '../../../assets/img/pacman/ghosts/P-left.gif';
import ghostPUpGif from '../../../assets/img/pacman/ghosts/P-up.gif';
import ghostPDownGif from '../../../assets/img/pacman/ghosts/P-down.gif';

import ghostIRightGif from '../../../assets/img/pacman/ghosts/I-right.gif';
import ghostILeftGif from '../../../assets/img/pacman/ghosts/I-left.gif';
import ghostIUpGif from '../../../assets/img/pacman/ghosts/I-up.gif';
import ghostIDownGif from '../../../assets/img/pacman/ghosts/I-down.gif';

import ghostCRightGif from '../../../assets/img/pacman/ghosts/C-right.gif';
import ghostCLeftGif from '../../../assets/img/pacman/ghosts/C-left.gif';
import ghostCUpGif from '../../../assets/img/pacman/ghosts/C-up.gif';
import ghostCDownGif from '../../../assets/img/pacman/ghosts/C-down.gif';

// Import des GIFs/PNGs spéciaux
import frightenedGif from '../../../assets/img/pacman/ghosts/frightened.gif';
import blinkingGif from '../../../assets/img/pacman/ghosts/blinking.gif';
import eyesRightPng from '../../../assets/img/pacman/ghosts/eyes-right.png';
import eyesLeftPng from '../../../assets/img/pacman/ghosts/eyes-left.png';
import eyesUpPng from '../../../assets/img/pacman/ghosts/eyes-up.png';
import eyesDownPng from '../../../assets/img/pacman/ghosts/eyes-down.png';

// Imports de Pacman
import pacmanRightGif from '../../../assets/img/pacman/pacman-right.gif';
import pacmanLeftGif from '../../../assets/img/pacman/pacman-left.gif';
import pacmanUpGif from '../../../assets/img/pacman/pacman-up.gif';
import pacmanDownGif from '../../../assets/img/pacman/pacman-down.gif';
import pacmanDeathGif from '../../../assets/img/pacman/pacman-death.gif';
import pacmanPng from '../../../assets/img/pacman/pacman.png';

export function useGameAssets() {
	const ghostImages = useMemo(() => ({
		'B': {
			'right': ghostBRightGif,
			'left': ghostBLeftGif,
			'up': ghostBUpGif,
			'down': ghostBDownGif
		},
		'Y': {
			'right': ghostPRightGif,
			'left': ghostPLeftGif,
			'up': ghostPUpGif,
			'down': ghostPDownGif
		},
		'I': {
			'right': ghostIRightGif,
			'left': ghostILeftGif,
			'up': ghostIUpGif,
			'down': ghostIDownGif
		},
		'C': {
			'right': ghostCRightGif,
			'left': ghostCLeftGif,
			'up': ghostCUpGif,
			'down': ghostCDownGif
		},
		'eyes': {
			'right': eyesRightPng,
			'left': eyesLeftPng,
			'up': eyesUpPng,
			'down': eyesDownPng
		},
		'frightened': frightenedGif,
		'blinking': blinkingGif
	}), []);

	const pacmanImages = useMemo(() => ({
		'right': pacmanRightGif,
		'left': pacmanLeftGif,
		'up': pacmanUpGif,
		'down': pacmanDownGif,
		'death': pacmanDeathGif,
		'default': pacmanPng
	}), []);

	return { ghostImages, pacmanImages };
}
