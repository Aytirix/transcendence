// Hook pour déterminer le type de mur basé sur ses voisins
export const useWallTypes = () => {
	const getWallType = (rowIndex: number, colIndex: number, grid: string[]): string => {
		// Vérifier les 4 voisins adjacents (haut, droite, bas, gauche)
		const hasTopWall = rowIndex > 0 && grid[rowIndex - 1][colIndex] === '#';
		const hasRightWall = colIndex < grid[rowIndex].length - 1 && grid[rowIndex][colIndex + 1] === '#';
		const hasBottomWall = rowIndex < grid.length - 1 && grid[rowIndex + 1][colIndex] === '#';
		const hasLeftWall = colIndex > 0 && grid[rowIndex][colIndex - 1] === '#';

		// Compter le nombre de murs voisins
		const wallCount = [hasTopWall, hasRightWall, hasBottomWall, hasLeftWall].filter(Boolean).length;

		// Déterminer le type de mur
		if (wallCount === 1) {
			// Extrémités
			if (hasTopWall) return 'wall-end-bottom';
			if (hasRightWall) return 'wall-end-left';
			if (hasBottomWall) return 'wall-end-top';
			if (hasLeftWall) return 'wall-end-right';
		} else if (wallCount === 2) {
			// Coin ou ligne droite
			if (hasTopWall && hasRightWall) return 'wall-corner-top-right';
			if (hasRightWall && hasBottomWall) return 'wall-corner-bottom-right';
			if (hasBottomWall && hasLeftWall) return 'wall-corner-bottom-left';
			if (hasLeftWall && hasTopWall) return 'wall-corner-top-left';
			if (hasTopWall && hasBottomWall) return 'wall-straight-vertical';
			if (hasLeftWall && hasRightWall) return 'wall-straight-horizontal';
		} else if (wallCount === 3) {
			// Jonctions en T
			if (!hasTopWall) return 'wall-t-top';
			if (!hasRightWall) return 'wall-t-right';
			if (!hasBottomWall) return 'wall-t-bottom';
			if (!hasLeftWall) return 'wall-t-left';
		} else if (wallCount === 4) {
			return 'wall-cross';
		}

		return 'wall-single'; // Mur isolé
	};

	return { getWallType };
};
