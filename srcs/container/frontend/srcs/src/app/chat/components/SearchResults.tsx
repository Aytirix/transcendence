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
  handleAddFriend,
}) => {
  if (searchResults.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">Aucun utilisateur trouvé.</div>
    );
  }

  return (
    <ul className="list bg-base-100 rounded-box shadow-md">
      {searchResults.map(user => {
        const friendshipStatus = getFriendshipStatus(user.id);
        const isCurrentUser = user.id === currentUserId;

        return (
          <li className="list-row flex justify-between w-full items-center" key={user.id}>
            <div className="flex gap-4 items-center">
            <div className="avatar">
             <div className="w-18 rounded-full"><img src={`https://${window.location.hostname}:3000/avatars/${user.avatar}`} alt="A" /></div></div>
              <div className="w-20 text-left">{user.username}</div>
              <div className="w-6 rounded-full"><img src={`https://${window.location.hostname}:3000/flags/${user.lang}_flat.png`} alt="A" /></div>
              </div>
            <div className="flex-1">
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
          </li>
        );
      })}
    </ul>
  );
};

export default SearchResults;
