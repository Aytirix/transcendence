// src/components/pacman/CreatePacmanMap.tsx
import React, { useState, useEffect } from 'react';
import './CreatePacmanMap.scss';
import { useNavigate } from 'react-router-dom';

interface CreatePacmanMapProps {
  onSave?: (mapData: string[]) => void;
  initialMap?: string[];
}

const CreatePacmanMap: React.FC<CreatePacmanMapProps> = ({ onSave, initialMap }) => {
  const DEFAULT_ROWS = 15;
  const DEFAULT_COLS = 20;
  const DEFAULT_TILE_SIZE = 30;
  
  // État pour stocker la grille de la carte
  const [grid, setGrid] = useState<string[]>(initialMap || Array(DEFAULT_ROWS).fill(' '.repeat(DEFAULT_COLS)));
  
  // État pour le type de cellule sélectionné à placer
  const [selectedTile, setSelectedTile] = useState<string>('#'); // Mur par défaut
  
  // État pour les dimensions de la carte
  const [rows, setRows] = useState<number>(initialMap?.length || DEFAULT_ROWS);
  const [cols, setColumns] = useState<number>(initialMap?.[0]?.length || DEFAULT_COLS);

  // Compteurs pour les spawns (pour éviter les doublons)
  const [spawnCounts, setSpawnCounts] = useState({
    P: 0,  // Pacman
    B: 0,  // Blinky (rouge)
    I: 0,  // Inky (bleu)
    Y: 0,  // Pinky (rose)
    C: 0,  // Clyde (orange)
  });

  const navigate = useNavigate();
  
  // Mettre à jour la grille lors du changement de dimensions
  useEffect(() => {
    if (!initialMap) {
      const newGrid = Array(rows).fill('').map(() => ' '.repeat(cols));
      setGrid(newGrid);
    }
  }, [rows, cols, initialMap]);

  // Compter les spawns existants lors du chargement
  useEffect(() => {
    const counts = { P: 0, B: 0, I: 0, Y: 0, C: 0 };
    grid.forEach(row => {
      for (const char of row) {
        if (char in counts) {
          counts[char as keyof typeof counts]++;
        }
      }
    });
    setSpawnCounts(counts);
  }, [initialMap]);

  // Fonction pour mettre à jour une cellule de la grille
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const newGrid = [...grid];
    const currentChar = newGrid[rowIndex][colIndex];
    const rowChars = newGrid[rowIndex].split('');
    
    // Si on remplace un spawn existant, décrémenter son compteur
    if (['P', 'B', 'I', 'Y', 'C'].includes(currentChar)) {
      setSpawnCounts(prev => ({
        ...prev,
        [currentChar]: Math.max(0, prev[currentChar as keyof typeof prev] - 1)
      }));
    }
    
    // Si on place un nouveau spawn, vérifier et incrémenter son compteur
    if (['P', 'B', 'I', 'Y', 'C'].includes(selectedTile)) {
      // Limite: 1 Pacman et jusqu'à 4 de chaque fantôme
      const maxCount = selectedTile === 'P' ? 1 : 4;
      
      if (spawnCounts[selectedTile as keyof typeof spawnCounts] >= maxCount) {
        alert(`Vous ne pouvez pas ajouter plus de ${maxCount} ${selectedTile === 'P' ? 'Pacman' : 'fantômes ' + selectedTile}`);
        return;
      }
      
      setSpawnCounts(prev => ({
        ...prev,
        [selectedTile]: prev[selectedTile as keyof typeof prev] + 1
      }));
    }
    
    rowChars[colIndex] = selectedTile;
    newGrid[rowIndex] = rowChars.join('');
    setGrid(newGrid);
  };

  // Fonction pour redimensionner la carte
  const resizeMap = () => {
    const newRows = Number(prompt('Nombre de lignes:', rows.toString()));
    const newCols = Number(prompt('Nombre de colonnes:', cols.toString()));
    
    if (newRows > 0 && newCols > 0) {
      setRows(newRows);
      setColumns(newCols);
      
      // Créer une nouvelle grille avec les bonnes dimensions
      const newGrid = Array(newRows).fill('').map((_, rowIdx) => {
        if (rowIdx < grid.length) {
          // Conserver les données existantes
          const existingRow = grid[rowIdx];
          if (newCols <= existingRow.length) {
            return existingRow.substring(0, newCols);
          } else {
            return existingRow + ' '.repeat(newCols - existingRow.length);
          }
        } else {
          return ' '.repeat(newCols);
        }
      });
      
      setGrid(newGrid);
      
      // Recompter les spawns après redimensionnement
      const counts = { P: 0, B: 0, I: 0, Y: 0, C: 0 };
      newGrid.forEach(row => {
        for (const char of row) {
          if (char in counts) {
            counts[char as keyof typeof counts]++;
          }
        }
      });
      setSpawnCounts(counts);
    }
  };

  // Fonction pour sauvegarder la carte
  const saveMap = () => {
    // Vérifier qu'il y a au moins un Pacman
    if (spawnCounts.P === 0) {
      alert("Votre carte doit contenir au moins un point de spawn pour Pacman (P)");
      return;
    }
    
    // Vérifier qu'il y a au moins un fantôme
    if (spawnCounts.B + spawnCounts.I + spawnCounts.Y + spawnCounts.C === 0) {
      alert("Votre carte doit contenir au moins un point de spawn pour un fantôme (B, I, Y ou C)");
      return;
    }
    
    if (onSave) {
      onSave(grid);
    } else {
      const mapJson = JSON.stringify(grid);
      localStorage.setItem('pacman-map', mapJson);
      alert('Carte sauvegardée!');
    }
  };

  // Fonction pour remplir les bordures de murs
  const addBorders = () => {
    const newGrid = [...grid];
    
    // Remplir première et dernière ligne
    newGrid[0] = '#'.repeat(cols);
    newGrid[rows-1] = '#'.repeat(cols);
    
    // Remplir première et dernière colonne de chaque ligne
    for (let i = 1; i < rows-1; i++) {
      const rowChars = newGrid[i].split('');
      rowChars[0] = '#';
      rowChars[cols-1] = '#';
      newGrid[i] = rowChars.join('');
    }
    
    setGrid(newGrid);
  };

  // Obtenir la couleur pour chaque type de spawn
  const getSpawnColor = (char: string): string => {
    switch(char) {
      case 'P': return 'yellow';
      case 'B': return 'red';
      case 'I': return 'blue';
      case 'Y': return 'pink';
      case 'C': return 'orange';
      default: return 'transparent';
    }
  };

  return (
    <div className="create-pacman-map">
      <h2>Créer une carte Pacman</h2>
      
      <div className="toolbar">
        <div className="tool-group">
          <button onClick={resizeMap}>Redimensionner</button>
          <button onClick={addBorders}>Ajouter bordures</button>
          <button onClick={saveMap}>Sauvegarder</button>
          <button onClick={() => navigate('/pacman')}>Retour</button>
        </div>
        
        <div className="spawn-counters">
          <span className="counter" style={{color: 'yellow'}}>Pacman: {spawnCounts.P}/1</span>
          <span className="counter" style={{color: 'red'}}>Blinky: {spawnCounts.B}/4</span>
          <span className="counter" style={{color: 'blue'}}>Inky: {spawnCounts.I}/4</span>
          <span className="counter" style={{color: 'pink'}}>Pinky: {spawnCounts.Y}/4</span>
          <span className="counter" style={{color: 'orange'}}>Clyde: {spawnCounts.C}/4</span>
        </div>
        
        <div className="tile-selector">
          <div 
            className={`tile-option ${selectedTile === '#' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('#')}
          >
            <div className="tile wall"></div>
            <span>Mur</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === ' ' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile(' ')}
          >
            <div className="tile empty"></div>
            <span>Vide</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === '.' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('.')}
          >
            <div className="tile pellet">
              <div className="dot"></div>
            </div>
            <span>Pastille</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'o' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('o')}
          >
            <div className="tile power-pellet">
              <div className="big-dot"></div>
            </div>
            <span>Super pastille</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === '-' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('-')}
          >
            <div className="tile door">
              <div className="door-line"></div>
            </div>
            <span>Porte</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'T' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('T')}
          >
            <div className="tile tunnel">T</div>
            <span>Tunnel</span>
          </div>

          {/* Points de spawn */}
          <div 
            className={`tile-option ${selectedTile === 'P' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('P')}
          >
            <div className="tile spawn spawn-pacman">P</div>
            <span>Spawn Pacman</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'B' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('B')}
          >
            <div className="tile spawn spawn-blinky">B</div>
            <span>Spawn Blinky</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'I' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('I')}
          >
            <div className="tile spawn spawn-inky">I</div>
            <span>Spawn Inky</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'Y' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('Y')}
          >
            <div className="tile spawn spawn-pinky">Y</div>
            <span>Spawn Pinky</span>
          </div>
          
          <div 
            className={`tile-option ${selectedTile === 'C' ? 'selected' : ''}`} 
            onClick={() => setSelectedTile('C')}
          >
            <div className="tile spawn spawn-clyde">C</div>
            <span>Spawn Clyde</span>
          </div>
        </div>
      </div>
      
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
                >
                  {cell === '.' && <div className="dot" />}
                  {cell === 'o' && <div className="big-dot" />}
                  {cell === '-' && <div className="door-line" />}
                  {cell === 'T' && <span>T</span>}
                  {isSpawnPoint(cell) && <span className="spawn-label">{cell}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="map-preview">
        <h3>Aperçu de la carte</h3>
        <pre className="map-code">
          {grid.join('\n')}
        </pre>
      </div>
    </div>
  );
};

// Fonction pour déterminer si un caractère est un point de spawn
const isSpawnPoint = (char: string): boolean => {
  return ['P', 'B', 'I', 'Y', 'C'].includes(char);
};

// Fonction pour déterminer la classe CSS de chaque cellule
const getCellClass = (char: string): string => {
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

export default CreatePacmanMap;