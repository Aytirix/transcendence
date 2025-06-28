// src/contexts/ChatWebSocketContext.tsx

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import useSafeWebSocket, { WebSocketStatus } from '../../api/useSafeWebSocket';
import { Group, Message, Friend, Member } from './types/chat';

interface ChatWebSocketContextType {
  // WebSocket status
  wsStatus: WebSocketStatus;
  socket: WebSocket | null;
  
  // Data
  groups: Group[];
  friends: Friend[];
  groupMessages: { [groupId: number]: Message[] };
  currentUserId: number | null;
  
  // Search
  searchResults: Member[] | null;
  inputSearch: string;
  setInputSearch: (value: string) => void;
  
  // Chat Actions
  sendMessage: (groupId: number, message: string) => void;
  loadMessages: (groupId: number, firstMessageId?: number) => void;
  createGroup: (groupName: string, userIds: number[]) => void;
  deleteGroup: (groupId: number) => void;
  
  // Friends Actions
  handleAddFriend: (userId: number) => void;
  handleAcceptFriend: (userId: number) => void;
  handleRefuseFriend: (userId: number) => void;
  handleRemoveFriend: (userId: number) => void;
  handleBlockedFriend: (userId: number) => void;
  handleUnBlockedFriend: (userId: number) => void;
  getFriendshipStatus: (userId: number) => string;
  
  // Feedback
  feedback: string | null;
  setFeedback: (feedback: string | null) => void;
}

const ChatWebSocketContext = createContext<ChatWebSocketContextType | undefined>(undefined);

export const useChatWebSocket = () => {
  const context = useContext(ChatWebSocketContext);
  if (context === undefined) {
    throw new Error('useChatWebSocket must be used within a ChatWebSocketProvider');
  }
  return context;
};

interface ChatWebSocketProviderProps {
  children: React.ReactNode;
}

export const ChatWebSocketProvider: React.FC<ChatWebSocketProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groupMessages, setGroupMessages] = useState<{ [groupId: number]: Message[] }>({});
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Member[] | null>(null);
  const [inputSearch, setInputSearch] = useState("");

  // Pour la recherche avec debounce
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fonction utilitaire pour le feedback temporaire
  const setTemporaryFeedback = useCallback((message: string, duration = 2000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), duration);
  }, []);

  // --- Gestion des messages WebSocket ---
  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      console.log("WebSocket data received:", data);
      
      switch (data.action) {
        case "new_message":
          if (data.group_id && data.result === "ok" && data.message) {
            setGroupMessages(prev => ({
              ...prev,
              [data.group_id]: [...(prev[data.group_id] || []), data.message]
            }));
          }
          console.log("FRIENDS", data.friends);
          if (data.friends) {
            setFriends(prev => [...prev, data.friends]);
          }
          break;

        case "loadMoreMessage":
          if (data.messages && data.group_id) {
            const arr = Object.values(data.messages) as Message[];
            arr.sort((a, b) => a.id - b.id);

            // Map sender_id to username
            for (const key in arr) {
              const sender_id = arr[key].sender_id;
              const username = friends.find(f => f.id === sender_id)?.username;
              console.log("Message mapping:", username, sender_id, arr[key].message);
              console.log("Available friends:", friends);
              arr[key].sender_id = username || "moi";
            }

            setGroupMessages(prev => ({
              ...prev,
              [data.group_id]: arr
            }));
          } else if (data.group_id) {
            setGroupMessages(prev => ({
              ...prev,
              [data.group_id]: []
            }));
          }
          break;

        case "init_connected": {
          const groupArray: Group[] = Object.values(data.groups || {});
          setGroups(groupArray);
          
          if (data.user?.id) setCurrentUserId(data.user.id);
          
          console.log("FRIENDS init:", data.friends);
          const groupFriends: Friend[] = Object.values(data.friends || {});
          if (groupFriends.length > 0) {
            setFriends(groupFriends);
          }
          console.log("FRIENDS2 init:", groupFriends);
          break;
        }

        case "create_group": {
          if (data.result === "ok" && data.group) {
            setGroups(prev => [...prev, data.group]);
            setTemporaryFeedback("Groupe créé avec succès !");
          } else {
            setTemporaryFeedback(data.error || "Erreur lors de la création du groupe.");
          }
          break;
        }

        case "delete_group": {
          if (data.group_id) {
            setGroups(prev => prev.filter(g => g.id !== data.group_id));
            setGroupMessages(prev => {
              const newMessages = { ...prev };
              delete newMessages[data.group_id];
              return newMessages;
            });
          }
          break;
        }

        // --- Actions amis ---
        case "search_user":
          if (data.result === "ok" && Array.isArray(data.users)) {
            setSearchResults(data.users);
          } else {
            setSearchResults([]);
          }
          break;

        case "add_friend":
          if (data.result === "ok") {
            setTemporaryFeedback("Demande d'amitié envoyée !");
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
            setTemporaryFeedback(data.error || "Erreur lors de l'envoi de la demande.");
          }
          break;

        case "accept_friend":
          if (data.result === "ok") {
            setTemporaryFeedback("Ami accepté !");
            setFriends(prev => prev.map(friend =>
              friend.id === data.user_id
                ? { ...friend, relation: { ...friend.relation, status: "friend" } }
                : friend
            ));
          } else {
            setTemporaryFeedback(data.error || "Erreur lors de l'acceptation.");
          }
          break;

        case "refuse_friend":
          if (data.result === "ok") {
            setTemporaryFeedback("Invitation refusée !");
            setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
          } else {
            setTemporaryFeedback(data.error || "Erreur lors du refus.");
          }
          break;

        case "remove_friend":
          if (data.result === "ok") {
            setTemporaryFeedback("Ami supprimé !");
            setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
          } else {
            setTemporaryFeedback(data.error || "Erreur lors de la suppression.");
          }
          break;

        case "block_user":
          if (data.result === "ok") {
            setTemporaryFeedback("Utilisateur bloqué !");
            setFriends(prev => prev.map(friend =>
              friend.id === data.user_id
                ? { ...friend, relation: { ...friend.relation, status: "blocked" } }
                : friend
            ));
          } else {
            setTemporaryFeedback(data.error || "Erreur lors du blocage.");
          }
          break;

        case "unblock_user":
          if (data.result === "ok") {
            setTemporaryFeedback("Utilisateur débloqué !");
            setFriends(prev => prev.map(friend =>
              friend.id === data.user_id
                ? { ...friend, relation: { ...friend.relation, status: "friend" } }
                : friend
            ));
          } else {
            setTemporaryFeedback(data.error || "Erreur lors du déblocage.");
          }
          break;

        case "friend_connected":
          if (data.user_id) {
            setFriends(prev => prev.map(f => 
              f.id === data.user_id ? { ...f, online: true } : f
            ));
          }
          break;

        case "friend_disconnected":
          if (data.user_id) {
            setFriends(prev => prev.map(f => 
              f.id === data.user_id ? { ...f, online: false } : f
            ));
          }
          break;

        default:
          console.log("Unhandled WebSocket action:", data.action);
          break;
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      setTemporaryFeedback("Erreur lors du traitement du message");
    }
  }, [friends, setTemporaryFeedback]);

  // --- Configuration WebSocket ---
  const socket = useSafeWebSocket({
    endpoint: '/chat',
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
    
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [inputSearch, socket]);

  // --- Actions Chat ---
  const sendMessage = useCallback((groupId: number, message: string) => {
    if (!message.trim() || socket?.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message: invalid message or WebSocket not ready");
      return;
    }
    
    socket.send(JSON.stringify({
      action: "new_message",
      group_id: groupId,
      message: message,
    }));
  }, [socket]);

  const loadMessages = useCallback((groupId: number, firstMessageId: number = 0) => {
    if (socket?.readyState !== WebSocket.OPEN) {
      console.warn("Cannot load messages: WebSocket not ready");
      return;
    }
    
    socket.send(JSON.stringify({
      action: "loadMoreMessage",
      group_id: groupId,
      firstMessageId: firstMessageId,
    }));
  }, [socket]);

  const createGroup = useCallback((groupName: string, userIds: number[]) => {
    if (!groupName.trim() || userIds.length === 0 || socket?.readyState !== WebSocket.OPEN) {
      setTemporaryFeedback("Veuillez saisir un nom de groupe et sélectionner au moins un ami.");
      return;
    }
    
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "create_group",
      group_name: groupName.trim(),
      users_id: userIds,
    }));
  }, [socket, setTemporaryFeedback]);

  const deleteGroup = useCallback((groupId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) {
      console.warn("Cannot delete group: WebSocket not ready");
      return;
    }
    
    socket.send(JSON.stringify({
      action: "delete_group",
      group_id: groupId,
    }));
  }, [socket]);

  // --- Actions Amis ---
  const handleAddFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("add_friend", userId);
    socket.send(JSON.stringify({
      action: "add_friend",
      user_id: userId,
    }));
  }, [socket]);

  const handleAcceptFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("accept_friend", userId);
    socket.send(JSON.stringify({
      action: "accept_friend",
      user_id: userId,
    }));
  }, [socket]);

  const handleRefuseFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("refuse_friend", userId);
    socket.send(JSON.stringify({
      action: "refuse_friend",
      user_id: userId,
    }));
  }, [socket]);

  const handleRemoveFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("remove_friend", userId);
    socket.send(JSON.stringify({
      action: "remove_friend",
      user_id: userId,
    }));
  }, [socket]);

  const handleBlockedFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("block_user", userId);
    socket.send(JSON.stringify({
      action: "block_user",
      user_id: userId,
    }));
  }, [socket]);

  const handleUnBlockedFriend = useCallback((userId: number) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("unblock_user", userId);
    socket.send(JSON.stringify({
      action: "unblock_user",
      user_id: userId,
    }));
  }, [socket]);

  const getFriendshipStatus = useCallback((userId: number) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "none";
    return friend.relation.status;
  }, [friends]);

  const contextValue: ChatWebSocketContextType = {
    wsStatus,
    socket,
    groups,
    friends,
    groupMessages,
    currentUserId,
    searchResults,
    inputSearch,
    setInputSearch,
    sendMessage,
    loadMessages,
    createGroup,
    deleteGroup,
    handleAddFriend,
    handleAcceptFriend,
    handleRefuseFriend,
    handleRemoveFriend,
    handleBlockedFriend,
    handleUnBlockedFriend,
    getFriendshipStatus,
    feedback,
    setFeedback,
  };

  return (
    <ChatWebSocketContext.Provider value={contextValue}>
      {children}
    </ChatWebSocketContext.Provider>
  );
};