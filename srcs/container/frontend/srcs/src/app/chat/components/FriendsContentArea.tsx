// src/components/FriendsContentArea.tsx
import React from "react";
import { Friend, Member } from "../types/chat";
import { WebSocketStatus } from "../../../api/useSafeWebSocket";
import FriendList from "./FriendList"; // Doit exister
import SearchResults from "./SearchResults"; // Doit exister

interface FriendsContentAreaProps {
  searchResults: Member[] | null;
  friends: Friend[];
  currentUserId: number | null;
  feedback: string | null;
  wsStatus: WebSocketStatus;

  getFriendshipStatus: (userId: number) => "none" | "pending" | "friend";
  handleAddFriend: (userId: number) => void;
  handleAcceptFriend: (userId: number) => void;
  handleRefuseFriend: (userId: number) => void;
  handleRemoveFriend: (userId: number) => void;
  handleBlockedFriend: (userId: number) => void;
  handleUnBlockedFriend: (userId: number) => void;
}

const FriendsContentArea: React.FC<FriendsContentAreaProps> = ({
  searchResults,
  friends,
  currentUserId,
  feedback,
  wsStatus,
  getFriendshipStatus,
  handleAddFriend,
  handleAcceptFriend,
  handleRefuseFriend,
  handleRemoveFriend,
          handleBlockedFriend,
        handleUnBlockedFriend,
}) => {
  return (
    <main className="flex-1 flex flex-col">
      {feedback && (
        <div className="m-4 p-2 bg-green-200 rounded text-green-900 text-center">{feedback}</div>
      )}
      {searchResults ? (
        <SearchResults
          searchResults={searchResults}
          currentUserId={currentUserId}
          getFriendshipStatus={getFriendshipStatus}
          handleAddFriend={handleAddFriend}
        />
      ) : (
        <FriendList
          friends={friends}
          handleAcceptFriend={handleAcceptFriend}
          handleRefuseFriend={handleRefuseFriend}
          handleRemoveFriend={handleRemoveFriend}
          handleBlockedFriend={handleBlockedFriend}
          handleUnBlockedFriend={handleUnBlockedFriend}
        />
      )}
    </main>
  );
};

export default FriendsContentArea;
