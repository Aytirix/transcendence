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
  inputSearch,
  setInputSearch,
}) => {
  return (
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
  );
};

export default FriendsSidebar;
