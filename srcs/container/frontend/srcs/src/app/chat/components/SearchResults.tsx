// src/components/SearchResults.tsx
import React from 'react';
import { Member } from '../types/chat'; // Assurez-vous que le chemin est correct

interface SearchResultsProps {
  searchResults: Member[];
  currentUserId: number | null;
  getFriendshipStatus: (userId: number) => "none" | "pending" | "friend";
  handleInvite: (userId: number) => void; // Pour inviter dans un groupe si pertinent (pas utilisé dans le code original pour la recherche globale)
  handleAddFriend: (userId: number) => void; // Pour envoyer une demande d'ami
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  currentUserId,
  getFriendshipStatus,
  // handleInvite, // Conservé au cas où l'on souhaite réintroduire l'invitation de groupe depuis la recherche globale
  handleAddFriend,
}) => {
  if (searchResults.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">Aucun utilisateur trouvé.</div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
      {searchResults.map(user => {
        const friendshipStatus = getFriendshipStatus(user.id);
        const isCurrentUser = user.id === currentUserId;

        return (
          <div
            key={user.id}
            className="p-2 bg-white rounded shadow flex items-center space-x-2"
          >
            {user.avatar
              ? (<img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />)
              : (<div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">{user.username[0]?.toUpperCase()}</div>)
            }
            <div className="flex-1">
              <div className="font-semibold">
                {user.username}
                {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(Vous)</span>}
              </div>
              <div className="text-xs text-gray-500">
                Langue : {user.lang ?? "?"}
                {friendshipStatus !== "none" && (
                  <span className="ml-2">
                    • {friendshipStatus === "pending" ? "Demande en attente" : "Déjà ami"}
                  </span>
                )}
              </div>
            </div>
            {/* BOUTONS ACTIONS */}
            <div className="flex space-x-2">
              {!isCurrentUser && friendshipStatus === "none" && (
                <button
                  className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => handleAddFriend(user.id)}
                >
                  Ajouter ami
                </button>
              )}
              {/* Bouton Inviter dans un groupe, si la recherche est liée à un groupe spécifique */}
              {/* {!isCurrentUser && selectedGroup && !selectedGroup.members.some(m => m.id === user.id) && (
                <button
                  className="text-sm px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                  onClick={() => handleInvite(user.id)}
                >
                  Inviter dans le groupe
                </button>
              )} */}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;
