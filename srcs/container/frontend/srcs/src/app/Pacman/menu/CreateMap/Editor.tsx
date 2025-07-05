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
  teleportMap?: Array<Array<{x: number, y: number}>>;
  unassignedTeleports?: Array<{x: number, y: number}>;
}

const Editor: React.FC<EditorProps> = ({
  grid,
  DEFAULT_TILE_SIZE,
  isSpawnPoint,
  getSpawnColor,
  getCellClass,
  handleCellClick,
  handleCellEnter,
  teleportMap = [],
  unassignedTeleports = []
}) => {
  // Fonction pour déterminer le statut d'un tunnel
  const getTunnelStatus = (rowIndex: number, colIndex: number) => {
    const isTunnel = (char: string) => ['T'].includes(char);
    
    if (!isTunnel(grid[rowIndex][colIndex])) {
      return { status: 'none', color: '', pairId: null };
    }

    // Vérifier si c'est un tunnel non assigné
    const isUnassigned = unassignedTeleports.some(t => t.x === colIndex && t.y === rowIndex);
    if (isUnassigned) {
      return { status: 'unpaired', color: '#888888', pairId: null };
    }

    // Trouver l'ID de la paire dans teleportMap
    let pairId = null;
    teleportMap.forEach((pair, index) => {
      if (pair.length === 2) {
        const [pos1, pos2] = pair;
        if ((pos1.x === colIndex && pos1.y === rowIndex) ||
            (pos2.x === colIndex && pos2.y === rowIndex)) {
          pairId = index;
        }
      }
    });

    if (pairId !== null) {
      // Couleurs simples pour les paires
      const colors = ['#00ff00', '#ff9900', '#ff0099', '#0099ff', '#ffff00', '#9900ff'];
      const color = colors[pairId % colors.length];
      return { status: 'paired', color, pairId };
    }

    return { status: 'unknown', color: '#888888', pairId: null };
  };

  return (
    <div className="map-editor">
      <div className="grid-container">
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid-row">
            {row.split('').map((cell, colIndex) => {
              const tunnelStatus = getTunnelStatus(rowIndex, colIndex);
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`grid-cell ${getCellClass(cell)}`}
                  style={{
                    width: DEFAULT_TILE_SIZE,
                    height: DEFAULT_TILE_SIZE,
                    ...(isSpawnPoint(cell) ? { backgroundColor: getSpawnColor(cell) } : {}),
                    ...(tunnelStatus.status !== 'none' ? { borderColor: tunnelStatus.color } : {})
                  }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
                >
                  {cell === '.' && <div className="dot" />}
                  {cell === 'o' && <div className="big-dot" />}
                  {cell === '-' && <div className="door-line" />}
                  {cell === 'T' && (
                    <div 
                      className={`tunnel-content tunnel-${tunnelStatus.status}`}
                      style={{ 
                        color: tunnelStatus.color,
                        borderColor: tunnelStatus.color,
                        backgroundColor: tunnelStatus.status === 'paired' ? `${tunnelStatus.color}20` : 'transparent',
                      }}
                    >T</div>
                  )}
                  {isSpawnPoint(cell) && <span className="spawn-label">{cell}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;