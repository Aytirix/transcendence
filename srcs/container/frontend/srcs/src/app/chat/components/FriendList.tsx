// src/components/FriendList.tsx
import React from 'react';
import { Friend } from '../types/chat'; // Assurez-vous que le chemin est correct

interface FriendListProps {
  friends: Friend[];
  handleAcceptFriend: (userId: number) => void;
  handleRefuseFriend: (userId: number) => void;
  handleRemoveFriend: (userId: number) => void;
  // handleOpenPrivateChat: (friendId: number, privmsgId: number) => void; // À ajouter si nécessaire
}

const FriendList: React.FC<FriendListProps> = ({
  friends,
  handleAcceptFriend,
  handleRefuseFriend,
  handleRemoveFriend,
  // handleOpenPrivateChat
}) => {
  console.log("friendProp",friends);
  if (friends.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Aucun ami pour le moment
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="p-4 bg-white rounded shadow flex items-center space-x-3"
        >
          {friend.avatar ? (
            <img src={friend.avatar} alt={friend.username} className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold">
              {friend.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold text-lg">{friend.username}</div>
            <div className="text-sm text-gray-500">
              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${friend.online ? "bg-green-500" : "bg-gray-400"}`}></span>
              {friend.online ? "En ligne" : "Hors ligne"} • Langue: {friend.lang ?? "?"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Statut: {friend.relation.status === "pending" ? "En attente" : "Ami"}
            </div>
          </div>

          <div className="flex space-x-2">
            {friend.relation.status === "pending" ? (
              <>
                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                  onClick={() => handleAcceptFriend(friend.id)}
                  hidden={(friend.relation.target === friend.id)?true:false}
                >
                  Accepter
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  onClick={() => handleRefuseFriend(friend.id)}
                >
                  Refuser
                </button>
              </>
            ) : (
               // <> // À décommenter si chat privé implémenté
               //  {friend.relation.privmsg_id && (
               //    <button
               //      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
               //      onClick={() => handleOpenPrivateChat(friend.id, friend.relation.privmsg_id!)}
               //    >
               //      Message
               //    </button>
               //  )}
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  onClick={() => handleRemoveFriend(friend.id)}
                >
                  Retirer
                </button>
               // </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendList;
