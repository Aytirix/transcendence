import React, { useEffect } from 'react';
import '../../assets/styles/pacman/Maps.scss';
import { state, PacmanMap } from '../../types/pacmanTypes';

interface MapsProps {
  onCreateMap?: () => void;
  onEditMap?: (map: PacmanMap) => void; // Ajouter cette prop
  state: state;
}

const Maps: React.FC<MapsProps> = ({ onCreateMap, onEditMap, state }) => {
  // Utilisez useEffect pour demander les cartes au chargement du composant
  const deleteMap = (map: { id: number }) => {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(
        JSON.stringify({
          action: 'deleteMap',
          id: map.id,
        })
      );
    }
  };
  const fetchMaps = () => {
	if (state.ws && state.ws.readyState === WebSocket.OPEN) {
		state.ws.send(
			JSON.stringify({
				action: 'getAllMapForUser',
			})
		);
	}
};

useEffect(() => {
	fetchMaps(); // Charger les cartes au montage du composant
}, [state.ws]);

  useEffect(() => {
    // Vérifier que le websocket est bien connecté
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      // Envoyer la requête pour obtenir toutes les cartes
      state.ws.send(
        JSON.stringify({
          action: 'getAllMapForUser',
        })
      );
    }
  }, [state.ws]); // Dépendance à state.ws pour réexécuter si le websocket change

  return (
    <div className="maps">
      <h2 className="maps-title">Cartes</h2>
      <p className="maps-description">
        Vous pouvez créer vos propres cartes et les partager avec la communauté. Utilisez l'éditeur de carte pour
        concevoir des niveaux uniques.
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
              <li key={map.id || Math.random()} className="map-item">
                <div className="map-info">
                  <span className="map-name">{map.name}</span>
                  <span className="map-status">{map.is_public ? 'Public' : 'Privé'}</span>

                  <span className={`map-validity ${map.is_valid ? 'valid' : 'invalid'}`}>
                    {map.is_valid ? 'Valide' : 'Invalide'}
                  </span>
                </div>

                <div className="map-actions">
                  {map.id !== undefined && (
                    <>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Empêche la propagation du clic
                          // Logique pour supprimer la carte
                            deleteMap(map as { id: number });
                        }}
                      >
                        <span className="icon">🗑️</span>
                        <span className="text">Supprimer</span>
                      </button>

                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (map.id !== undefined && onEditMap) {
                            onEditMap(map);
                          }
                        }}
                      >
                        <span className="icon">✏️</span>
                        <span className="text">Éditer</span>
                      </button>

                      {map.is_valid && (
                        <button
                          className="play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logique pour jouer sur cette carte
                            console.log(`Jouer sur la carte: ${map.name}`);
                          }}
                        >
                          <span className="icon">▶️</span>
                          <span className="text">Jouer</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
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
