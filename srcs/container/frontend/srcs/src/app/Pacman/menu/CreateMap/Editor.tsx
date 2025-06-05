// src/components/pacman/Editor.tsx
import React from 'react';
import './../../../assets/styles/pacman/CreatePacmanMap.scss'; // Vous pourriez vouloir créer un fichier CSS séparé plus tard

export const isSpawnPoint = (char: string): boolean => {
  return ['P', 'B', 'I', 'Y', 'C'].includes(char);
};

export const getSpawnColor = (char: string): string => {
  switch (char) {
    case 'P': return 'yellow';
    case 'B': return 'red';
    case 'I': return 'blue';
    case 'Y': return 'pink';
    case 'C': return 'orange';
    default: return 'transparent';
  }
};

export const getCellClass = (char: string): string => {
  switch (char) {
    case '#': return 'wall';
    case '.': return 'pellet';
    case 'o': return 'power-pellet';
    case '-': return 'door';
    case 'T': return 'tunnel';
    case ' ': return 'empty';
    case 'P': return 'spawn spawn-pacman';
    case 'B': return 'spawn spawn-blinky';
    case 'I': return 'spawn spawn-inky';
    case 'Y': return 'spawn spawn-pinky';
    case 'C': return 'spawn spawn-clyde';
    default: return 'empty';
  }
};

interface EditorProps {
  grid: string[];
  DEFAULT_TILE_SIZE: number;
  isSpawnPoint: (char: string) => boolean;
  getSpawnColor: (char: string) => string;
  getCellClass: (char: string) => string;
  handleCellClick: (rowIndex: number, colIndex: number) => void;
  handleCellEnter: (rowIndex: number, colIndex: number) => void;
}

const Editor: React.FC<EditorProps> = ({
  grid,
  DEFAULT_TILE_SIZE,
  isSpawnPoint,
  getSpawnColor,
  getCellClass,
  handleCellClick,
  handleCellEnter
}) => {
  return (
    <div className="map-editor">
      <div className="grid-container">
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid-row">
            {row.split('').map((cell, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={`grid-cell ${getCellClass(cell)}`}
                style={{
                  width: DEFAULT_TILE_SIZE,
                  height: DEFAULT_TILE_SIZE,
                  ...(isSpawnPoint(cell) ? { backgroundColor: getSpawnColor(cell) } : {})
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
              >
                {cell === '.' && <div className="dot" />}
                {cell === 'o' && <div className="big-dot" />}
                {cell === '-' && <div className="door-line" />}
                {cell === 'T' && (
                  <div className="tunnel-content">
                    <span className="tunnel-icon">↔️</span>
                  </div>
                )}
                {isSpawnPoint(cell) && <span className="spawn-label">{cell}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;