// src/FriendsSearchPage.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import useSafeWebSocket, { WebSocketStatus } from "../../api/useSafeWebSocket";
import { Member, Friend } from "./types/chat";
import FriendsSidebar from "./components/FriendsSidebar"; // à créer (amis & recherche)
import FriendsContentArea from "./components/FriendsContentArea"; // à créer (liste, recherche, etc.)

const endpoint = `/chat`;

const FriendsSearchPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inputSearch, setInputSearch] = useState("");
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Member[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Pour la recherche avec debounce
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // WS handler
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.action) {
      case "init_connected":
        if (data.user?.id) setCurrentUserId(data.user.id);
        if (data.friends) setFriends(data.friends);
        break;
      case "search_user":
        if (data.result === "ok" && Array.isArray(data.users)) {
          setSearchResults(data.users);
        } else {
          setSearchResults([]);
        }
        break;
      case "add_friend":
        if (data.result === "ok") {
          setFeedback("Demande d'amitié envoyée !");
          if (data.user) {
            if (!friends.some(f => f.id === data.user.id)) {
              const newFriend: Friend = {
                ...data.user,
                relation: {
                  status: "pending",
                  target: data.user.id,
                  privmsg_id: null
                },
                online: false
              };
              setFriends(prev => [...prev, newFriend]);
            }
          }
        } else {
          setFeedback(data.error || "Erreur lors de l'envoi de la demande.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      case "accept_friend":
        if (data.result === "ok") {
          setFeedback("Ami accepté !");
          setFriends(prev => prev.map(friend =>
            friend.id === data.user_id
              ? { ...friend, relation: { ...friend.relation, status: "friend" } }
              : friend
          ));
        } else {
          setFeedback(data.error || "Erreur lors de l'acceptation.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      case "refuse_friend":
        if (data.result === "ok") {
          setFeedback("Invitation refusée !");
          setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
        } else {
          setFeedback(data.error || "Erreur lors du refus.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      case "remove_friend":
        if (data.result === "ok") {
          setFeedback("Ami supprimé !");
          setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
        } else {
          setFeedback(data.error || "Erreur lors de la suppression.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      case "friend_connected":
        if (data.user_id) setFriends(prev => prev.map(f => f.id === data.user_id ? { ...f, online: true } : f));
        break;
      case "friend_disconnected":
        if (data.user_id) setFriends(prev => prev.map(f => f.id === data.user_id ? { ...f, online: false } : f));
        break;
      default:
        break;
    }
  }, [friends]);

  // WebSocket config
  const socket = useSafeWebSocket({
    endpoint,
    onMessage: handleWebSocketMessage,
    onStatusChange: setWsStatus,
    reconnectDelay: 1000,
    maxReconnectAttempts: 15,
    pingInterval: 30000,
  });

  // --- Recherche d'ami (debounce) ---
  useEffect(() => {
    if (!inputSearch.trim()) {
      setSearchResults(null);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (socket?.readyState !== WebSocket.OPEN) return;
      setSearchResults(null);
      socket.send(JSON.stringify({
        action: "search_user",
        name: inputSearch,
        group_id: null,
      }));
    }, 500);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [inputSearch, socket]);

  // --- Actions amis
  const handleAddFriend = (userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "add_friend",
      user_id: userId,
    }));
  };
  const handleAcceptFriend = (userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "accept_friend",
      user_id: userId,
    }));
  };
  const handleRefuseFriend = (userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "refuse_friend",
      user_id: userId,
    }));
  };
  const handleRemoveFriend = (userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "remove_friend",
      user_id: userId,
    }));
  };

  // Status
  const getFriendshipStatus = useCallback((userId: number) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "none";
    return friend.relation.status;
  }, [friends]);

  return (
    <div className="flex h-screen">
      <FriendsSidebar
        friends={friends}
        inputSearch={inputSearch}
        setInputSearch={setInputSearch}
        wsStatus={wsStatus}
      />
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
      />
    </div>
  );
};

export default FriendsSearchPage;
