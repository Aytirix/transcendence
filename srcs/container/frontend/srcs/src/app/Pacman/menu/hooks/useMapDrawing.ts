import { useEffect } from 'react';

interface UseMapDrawingProps {
	grid: string[];
	setGrid: (grid: string[]) => void;
	selectedTile: string;
	setGridModified: (modified: boolean) => void;
	isDrawing: boolean;
	setIsDrawing: (drawing: boolean) => void;
	rows: number;
	cols: number;
}

export const useMapDrawing = ({
	grid,
	setGrid,
	selectedTile,
	setGridModified,
	isDrawing,
	setIsDrawing,
	rows,
	cols
}: UseMapDrawingProps) => {
	
	// Gestion des événements de souris globaux
	useEffect(() => {
		const handleMouseDown = () => {
			setIsDrawing(true);
		};
		
		const handleMouseUp = () => {
			setIsDrawing(false);
		};
		
		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);
		
		return () => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [setIsDrawing]);

	// Fonction pour mettre à jour une cellule
	const handleCellClick = (rowIndex: number, colIndex: number) => {
		const newGrid = [...grid];
		const rowChars = newGrid[rowIndex].split('');
		rowChars[colIndex] = selectedTile;
		newGrid[rowIndex] = rowChars.join('');

		// Gestion des points de spawn uniques
		if (['P', 'B', 'I', 'Y', 'C'].includes(selectedTile)) {
			const spawnChar = selectedTile;
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < cols; j++) {
					if (i !== rowIndex || j !== colIndex) {
						if (newGrid[i][j] === spawnChar) {
							newGrid[i] = newGrid[i].substring(0, j) + ' ' + newGrid[i].substring(j + 1);
						}
					}
				}
			}
		}

		setGrid(newGrid);
		setGridModified(true);
	};

	// Fonction pour le dessin en continu
	const handleCellEnter = (rowIndex: number, colIndex: number) => {
		if (isDrawing) {
			handleCellClick(rowIndex, colIndex);
		}
	};

	// Fonction pour ajouter des bordures
	const addBorders = () => {
		const newGrid = [...grid];

		// Remplir première et dernière ligne
		newGrid[0] = '#'.repeat(cols);
		newGrid[rows - 1] = '#'.repeat(cols);

		// Remplir première et dernière colonne de chaque ligne
		for (let i = 1; i < rows - 1; i++) {
			const rowChars = newGrid[i].split('');
			rowChars[0] = '#';
			rowChars[cols - 1] = '#';
			newGrid[i] = rowChars.join('');
		}

		setGrid(newGrid);
		setGridModified(true);
	};

	return {
		handleCellClick,
		handleCellEnter,
		addBorders,
	};
};
