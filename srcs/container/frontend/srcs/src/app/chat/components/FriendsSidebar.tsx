// src/components/FriendsSidebar.tsx
import React from "react";
import { Friend, WebSocketStatus } from "../types/chat";

interface FriendsSidebarProps {
  friends: Friend[];
  inputSearch: string;
  setInputSearch: (input: string) => void;
  wsStatus: WebSocketStatus;
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({
  friends,
  inputSearch,
  setInputSearch,
  wsStatus,
}) => {
  return (
    <aside className="w-64 bg-gray-100 border-r flex flex-col">
      {/* Barre de recherche */}
      <label
        htmlFor="search"
        className="flex items-center border bg-gray-200 p-2 m-4 rounded"
      >
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
        <input
          type="search"
          className="grow bg-transparent outline-none ml-2"
          placeholder="Rechercher un utilisateur"
          value={inputSearch}
          onChange={e => setInputSearch(e.target.value)}
        />
      </label>

      <div className="p-4 font-bold text-xl">Amis</div>
      {/* Liste des amis */}
      <div className="flex-1 overflow-y-auto">
        {friends.length === 0 ? (
          <div className="text-gray-500 p-4">Aucun ami pour le moment.</div>
        ) : (
          friends.map(friend => (
            <div
              key={friend.id}
              className="p-3 border-b hover:bg-blue-100 flex items-center justify-between"
            >
              <span>
                {friend.username}
                {friend.online && <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block" title="en ligne"></span>}
              </span>
              <span className={`text-xs ml-2 ${
                friend.relation.status === "friend"
                  ? "text-green-700"
                  : friend.relation.status === "pending"
                  ? "text-yellow-600"
                  : "text-gray-500"
                }`}>
                {friend.relation.status === "friend" ? "Ami" : "En attente"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Statut */}
      <div className="text-xs text-gray-700 p-2 border-t">
        Statut du chat:{" "}
        <span
          className={
            wsStatus === "Connected"
              ? "text-green-600"
              : wsStatus === "Error" || wsStatus === "Closed"
              ? "text-red-500"
              : "text-yellow-600"
          }
        >
          {wsStatus}
        </span>
      </div>
    </aside>
  );
};

export default FriendsSidebar;
