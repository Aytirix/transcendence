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
          {/* {console.log("friend.id",friend.id, friend.username)} */}
          <div className="flex gap-4 items-center">
            <div className={`avatar ${friend.online ? "avatar-online" : "avatar-offline"}`}>
              <div className="w-18 rounded-full"><img src={`https://${window.location.hostname}:3000/avatars/${friend.avatar}`} alt="A" /></div></div>
            <div className="w-20 text-left">{friend.username}</div>
            <div className="w-6 rounded-full"><img src={`https://${window.location.hostname}:3000/flags/${friend.lang}_flat.png`} alt="A" /></div>
            <div className={`${friend.relation.status === "friend"
              ? "text-green-700"
              : friend.relation.status === "pending"
                ? "text-yellow-600"
                : "text-gray-500"
              }`}>
              {friend.relation.status === "pending" ? "En attente" : "Ami"}
            </div>
          </div>
          {friend.relation.status === "pending" ? (
            <div className=''>
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium mx-2"
                onClick={() => handleAcceptFriend(friend.id)}
                hidden={(friend.relation.target === friend.id) ? true : false}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleRefuseFriend(friend.id)}
              // hidden={(friend.relation.target === friend.id) ? true : false}
              //accepter ou refuser une demande ami
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : friend.relation.status === "blocked" ? (
            <div>
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                onClick={() => handleUnBlockedFriend(friend.id)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="6" y="11" width="12" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 1 1 8 0" />
                </svg>
              </button>
              <span> </span>
              <button
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                onClick={() => handleRemoveFriend(friend.id)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) :
            (
              <div>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  onClick={() => handleBlockedFriend(friend.id)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 17v1M8 21h8a2 2 0 002-2v-7a2 2 0 00-2-2H8a2 2 0 00-2 2v7a2 2 0 002 2zM17 9V7a5 5 0 00-10 0v2" />
                  </svg>
                </button>
                <span> </span>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  onClick={() => handleRemoveFriend(friend.id)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
