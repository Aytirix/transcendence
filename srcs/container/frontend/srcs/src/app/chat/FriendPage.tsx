// src/FriendsSearchPage.tsx

import React from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import FriendsSidebar from "./components/FriendsSidebar";
import FriendsContentArea from "./components/FriendsContentArea";

const FriendPage: React.FC = () => {
  const {
    friends,
    inputSearch,
    setInputSearch,
    wsStatus,
    currentUserId,
    searchResults,
    feedback,
    getFriendshipStatus,
    handleAddFriend,
    handleAcceptFriend,
    handleRefuseFriend,
    handleRemoveFriend,
    handleBlockedFriend,
    handleUnBlockedFriend,
  } = useChatWebSocket();

  return (
    <div className="mt-16">
      <div className="navbar bg-base-100 shadow-sm">
        <FriendsSidebar
          friends={friends}
          inputSearch={inputSearch}
          setInputSearch={setInputSearch}
          wsStatus={wsStatus}
        />
        <div className="navbar-center">
          {searchResults
            ? "Résultats de recherche"
            : `Liste des amis (${friends.length})`
          }
        </div>
      </div>
      <FriendsContentArea
        searchResults={searchResults}
        friends={friends}
        currentUserId={currentUserId}
        feedback={feedback}
        wsStatus={wsStatus}
        getFriendshipStatus={getFriendshipStatus}
        handleAddFriend={handleAddFriend}
        handleAcceptFriend={handleAcceptFriend}
        handleRefuseFriend={handleRefuseFriend}
        handleRemoveFriend={handleRemoveFriend}
        handleBlockedFriend={handleBlockedFriend}
        handleUnBlockedFriend={handleUnBlockedFriend}
      />
    </div>
  );
};

export default FriendPage;