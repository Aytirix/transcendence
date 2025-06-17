
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
      <div className="navbar-start">
        <input
          type="search"
          className="input input-bordered w-24 md:w-auto"
          placeholder="Rechercher un utilisateur"
          value={inputSearch}
          onChange={e => setInputSearch(e.target.value)}
        />
      </div>
  );
};

export default FriendsSidebar;
