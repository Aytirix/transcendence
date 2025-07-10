// src/components/Board.tsx
import React from 'react';
import reine from './assets/img/reine.svg';
import croix_manual from './assets/img/croix_manual.svg';
import croix_auto from './assets/img/croix_auto.svg';
import { BoardProps } from './types';

const Board: React.FC<BoardProps> = ({ game, makeMove }) => {
  // Vérification que le jeu est correctement initialisé
  if (!game || !game.map || !game.map.board_size || !game.state || !game.state.boardState) {
    return <div></div>;
  }

  const bs = game.map.board_size;
  // Mise à jour des CSS variables pour le nombre de colonnes/lignes.
  document.documentElement.style.setProperty('--board-cols', bs.toString());
  document.documentElement.style.setProperty('--board-rows', bs.toString());

  const { map, state } = game;

  // Logique du clic sur une cellule
  const handleClick = (r: number, c: number, currentVal: number) => {
	let newState = 0;
    if (currentVal === 0 || currentVal === 1) {
      newState = currentVal + 1;
    } else if (currentVal === 2 || currentVal === 3) {
      newState = 0;
    } else if (currentVal === 4) {
	  newState = 2;
	}
    makeMove(r, c, newState);
  };

  return (
    <div
      id="board"
      className="board"
      style={{ border: '5px solid #ffffff' }} // Bordure épaisse sur le contour de la map
    >
      {state.boardState?.map((row, r) =>
        row.map((cellVal, c) => {
          const reg = map.regionAssignment![r][c];
          const thick = '4px solid black';
          const thin = '2px solid black';

          const cellStyle = {
            backgroundColor: state.regionColors![reg],
            // Bordure gauche
            borderLeft: c === 0 || map.regionAssignment![r][c - 1] !== reg ? thick : thin,
            // Bordure haute
            borderTop: r === 0 || map.regionAssignment![r - 1][c] !== reg ? thick : thin,
            // Bordure droite
            borderRight: c === bs - 1 || map.regionAssignment![r][c + 1] !== reg ? thick : thin,
            // Bordure basse
            borderBottom: r === bs - 1 || map.regionAssignment![r + 1][c] !== reg ? thick : thin,
          };

		  return (
			<div
			  key={`${r}-${c}`}
			  className={`cell ${cellVal === 3 ? 'conflict' : ''}`}
			  style={cellStyle}
			  data-row={r}
			  data-col={c}
			  onClick={() => handleClick(r, c, cellVal)}
			>
			  {cellVal === 1 && <img src={croix_manual} alt="Croix manuelle" className="cross manual" />}
			  {cellVal === 4 && <img src={croix_auto} alt="Croix automatique" className="cross auto" />}
			  {(cellVal === 2 || cellVal === 3) && (<img src={reine} alt="Reine" className="queen" />)}
			</div>
		  );
        })
      )}
    </div>
  );
};

export default Board;
