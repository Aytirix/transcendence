import React, { useEffect } from 'react';
// import '../../assets/styles/pacman/Maps.scss';
import { state } from '../../types/pacmanTypes';

interface MapsProps {
  onCreateMap?: () => void;
  state: state;
}


const Maps: React.FC<MapsProps> = ({ onCreateMap, state }) => {
	// Utilisez useEffect pour demander les cartes au chargement du composant
	useEffect(() => {
		// Vérifier que le websocket est bien connecté
		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
		  // Envoyer la requête pour obtenir toutes les cartes
		  state.ws.send(JSON.stringify({
			action: 'getAllMapForUser'
		  }));
		}
	  }, [state.ws]); // Dépendance à state.ws pour réexécuter si le websocket change
	
	return (
    <div className='maps'>
      <h2 className="maps-title">Cartes</h2>
      <p className="maps-description">
        Vous pouvez créer vos propres cartes et les partager avec la communauté.
        Utilisez l'éditeur de carte pour concevoir des niveaux uniques.
      </p>
	  {/* Bouton pour créer une nouvelle carte */}
      <div className="map-editor-placeholder">
        <h3>Éditeur de carte</h3>
        {onCreateMap && (
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={onCreateMap}
          >
            Créer une nouvelle carte
          </button>
        )}
      </div>
	   {/* Afficher la liste des cartes */}
      <div className="maps-list">
        {state.maps && state.maps.length > 0 ? (
          <ul>
            {state.maps.map((map) => (
              <li key={map.id || Math.random()}>
                {map.name} - {map.is_public ? "Public" : "Privé"}
                {map.is_valid ? " ✓" : " ✗"}
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune carte disponible</p>
        )}
      </div>
    </div>
  );
};

export default Maps;
