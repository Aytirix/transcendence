import React, { useEffect, useRef } from 'react';
import { MenuProps } from './types';

const Menu: React.FC<MenuProps> = ({ game, updateParameters }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuRef.current && !menuRef.current.contains(target) && target.id !== 'menuToggle') {
        menuRef.current.style.display = 'none';
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (!game) return null;

  const updateGameParameter = (key: 'board_size' | 'difficultyLevel', value: number) => {
    updateParameters({ ...game.setting, [key]: value });
  };

  const handleDecrease = (key: 'board_size' | 'difficultyLevel', minValue: number) => {
    if (game.setting[key] > minValue) {
      updateGameParameter(key, game.setting[key] - 1);
    }
  };

  const handleIncrease = (key: 'board_size' | 'difficultyLevel', maxValue: number) => {
    if (game.setting[key] < maxValue) {
      updateGameParameter(key, game.setting[key] + 1);
    }
  };

  const handleToggle = (key: 'autoCross') => {
    updateParameters({ ...game.setting, [key]: !game.setting[key] });
  };

  const handleReset = () => {
    updateParameters({
      board_size: 9,
      difficultyLevel: 5,
      autoCross: false
    });
  };

  const toggleMenu = () => {
    if (menuRef.current) {
      menuRef.current.style.display = menuRef.current.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div>
      <button id="menuToggle" className="btn btn-info mb-3 mt-2" onClick={toggleMenu}>
        Menu
      </button>
      <div id="menuPanel" ref={menuRef}>
        <h5>Paramètres</h5>
        <div className="menu-option">
          <span>Taille du plateau: {game.map.board_size}×{game.map.board_size}</span>
          <div>
            <button className="btn btn-sm btn-secondary w-8" onClick={() => handleDecrease('board_size', 3)}> - </button>
            <button className="btn btn-sm btn-primary w-8" onClick={() => handleIncrease('board_size', 20)}> + </button>
          </div>
        </div>
        <div className="menu-option">
          <span>Niveau de difficulté: {game.setting.difficultyLevel}</span>
          <div>
            <button className="btn btn-sm btn-secondary w-8" onClick={() => handleDecrease('difficultyLevel', 1)}> - </button>
            <button className="btn btn-sm btn-primary w-8" onClick={() => handleIncrease('difficultyLevel', 20)}> + </button>
          </div>
        </div>
        <div className="menu-option">
          <span>Auto croix:</span>
          <input type="checkbox" checked={game.setting.autoCross} onChange={() => handleToggle('autoCross')} />
        </div>
        <div className="menu-option">
          <button className="btn btn-sm !text-red-500" onClick={handleReset}>Réinitialiser les paramètres</button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
