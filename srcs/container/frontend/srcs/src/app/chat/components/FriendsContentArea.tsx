// src/components/FriendsContentArea.tsx
import React from "react";
import { Friend } from "../types/chat";
import { WebSocketStatus } from "../../../api/useSafeWebSocket";
import FriendList from "./FriendList"; // Doit exister

interface FriendsContentAreaProps {
	searchResults: Friend[] | null;
	inputSearch: string;
	friends: Friend[];
	currentUserId: number | null;
	wsStatus: WebSocketStatus;

	getFriendshipStatus: (userId: number) => "none" | "pending" | "friend";
	handleAddFriend: (userId: number) => void;
	handleAcceptFriend: (userId: number) => void;
	handleRefuseFriend: (userId: number) => void;
	handleCancelFriend: (userId: number) => void;
	handleRemoveFriend: (userId: number) => void;
	handleBlockedFriend: (userId: number) => void;
	handleUnBlockedFriend: (userId: number) => void;
}

const FriendsContentArea: React.FC<FriendsContentAreaProps> = ({
	searchResults,
	inputSearch,
	friends,
	currentUserId,
	wsStatus,
	getFriendshipStatus,
	handleAddFriend,
	handleAcceptFriend,
	handleCancelFriend,
	handleRefuseFriend,
	handleRemoveFriend,
	handleBlockedFriend,
	handleUnBlockedFriend,
}) => {
	return (
		<main className="flex-1 flex flex-col">
			<FriendList
				friends={inputSearch.length > 0 ? (searchResults ?? []) : friends}
				handleAddFriend={handleAddFriend}
				currentUserId={currentUserId}
				handleAcceptFriend={handleAcceptFriend}
				handleRefuseFriend={handleRefuseFriend}
				handleCancelFriend={handleCancelFriend}
				handleRemoveFriend={handleRemoveFriend}
				handleBlockedFriend={handleBlockedFriend}
				handleUnBlockedFriend={handleUnBlockedFriend}
			/>
		</main>
	);
};

export default FriendsContentArea;
