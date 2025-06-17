import React from 'react';
import { Friend } from '../types/chat'; // Assurez-vous que le chemin est correct

interface FriendListProps {
  friends: Friend[];
  handleAcceptFriend: (userId: number) => void;
  handleRefuseFriend: (userId: number) => void;
  handleRemoveFriend: (userId: number) => void;
  handleBlockedFriend: (userId: number) => void;
  handleUnBlockedFriend: (userId: number) => void;
  // handleOpenPrivateChat: (friendId: number, privmsgId: number) => void; // À ajouter si nécessaire
}

const FriendList: React.FC<FriendListProps> = ({
  friends,
  handleAcceptFriend,
  handleRefuseFriend,
  handleRemoveFriend,
  handleBlockedFriend,
  handleUnBlockedFriend
}) => {
  console.log("friendProp", friends);
  if (friends.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Aucun ami pour le moment
      </div>
    );
  }

  return (
      <ul className="list bg-base-100 rounded-box shadow-md">
        {friends.map((friend) => (
          <li className="list-row flex justify-between w-full items-center" key={friend.id}>
            {console.log("friend.id",friend.id, friend.username)}
            <div className="flex gap-4 items-center">
            <div className={`avatar ${friend.online ? "avatar-online" : "avatar-offline"}`}>
             <div className="w-18 rounded-full"><img src={`https://${window.location.hostname}:3000/avatars/${friend.avatar}`} alt="A" /></div></div>
              <div className="w-20 text-left">{friend.username}</div>
              <div className="w-6 rounded-full"><img src={`https://${window.location.hostname}:3000/flags/${friend.lang}_flat.png`} alt="A" /></div>
              <div className={`${
                friend.relation.status === "friend"
                ? "text-green-700"
                : friend.relation.status === "pending"
                ? "text-yellow-600"
                : "text-gray-500"
              }`}>
                {friend.relation.status === "pending" ? "En attente" : "Ami"}
              </div>
              </div>
            {friend.relation.status === "pending" ? (
              <>
                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                  onClick={() => handleAcceptFriend(friend.id)}
                  hidden={(friend.relation.target === friend.id) ? true : false}
                >
                  Accepter
                </button>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  onClick={() => handleRefuseFriend(friend.id)}
                  // hidden={(friend.relation.target === friend.id) ? true : false}
                >
                  X
                </button>
              </>
            ) : friend.relation.status === "blocked" ? ( 
              <div>
                <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleUnBlockedFriend(friend.id)}
              >
                deblock
              </button>
              <span> </span>
              <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleRemoveFriend(friend.id)}
              >
                X
              </button>
              </div>
            ) : 
            ( 
              <div>
                <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleBlockedFriend(friend.id)}
              >
                block
              </button>
              <span> </span>
              <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleRemoveFriend(friend.id)}
              >
                X
              </button>
              </div>
            ) 
            }
          </li>



        ))}
      </ul>
  );
};

export default FriendList;
