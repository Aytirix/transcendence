import { useMemo } from 'react';

const CONTAINER_SIZE_WIDTH = 709;
const CONTAINER_SIZE_HEIGHT = 761;

interface UseGameLayoutProps {
	grid: string[];
	tileSize: number;
}

export function useGameLayout({ grid, tileSize }: UseGameLayoutProps) {
	const layout = useMemo(() => {
		if (!grid || grid.length === 0) {
			return {
				numRows: 0,
				numCols: 0,
				mapWidth: 0,
				mapHeight: 0,
				scale: 1,
				offsetX: 0,
				offsetY: 0
			};
		}

		const numRows = grid.length;
		const numCols = grid[0].length;
		const mapWidth = numCols * tileSize;
		const mapHeight = numRows * tileSize;
		const scale = Math.min(
			CONTAINER_SIZE_WIDTH / mapWidth,
			CONTAINER_SIZE_HEIGHT / mapHeight
		);

		const offsetX = (CONTAINER_SIZE_WIDTH - mapWidth * scale) / 2;
		const offsetY = (CONTAINER_SIZE_HEIGHT - mapHeight * scale) / 2;

		return {
			numRows,
			numCols,
			mapWidth,
			mapHeight,
			scale,
			offsetX,
			offsetY
		};
	}, [grid, tileSize]);

	return layout;
}
