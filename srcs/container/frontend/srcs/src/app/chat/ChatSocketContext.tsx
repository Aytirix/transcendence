// src/contexts/ChatWebSocketContext.tsx

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import useSafeWebSocket, { WebSocketStatus } from '../../api/useSafeWebSocket';
import { Group, Message, Friend } from './types/chat';

interface ChatWebSocketContextType {
  // WebSocket status
  wsStatus: WebSocketStatus;
  socket: WebSocket | null;
  
  // Data
  groups: Group[];
  friends: Friend[];
  groupMessages: { [groupId: number]: Message[] };
  
  // Actions
  sendMessage: (groupId: number, message: string) => void;
  loadMessages: (groupId: number, firstMessageId?: number) => void;
  createGroup: (groupName: string, userIds: number[]) => void;
  deleteGroup: (groupId: number) => void;
  
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

  // --- Gestion des messages WebSocket ---
  const handleWebSocketMessage = useCallback((data: any) => {
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
          setFeedback("Groupe créé avec succès !");
        } else {
          setFeedback(data.error || "Erreur lors de la création du groupe.");
        }
        setTimeout(() => setFeedback(null), 2000);
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

      default:
        console.log("Unhandled WebSocket action:", data.action);
        break;
    }
  }, [friends]);

  // --- Configuration WebSocket ---
  const socket = useSafeWebSocket({
    endpoint: '/chat',
    onMessage: handleWebSocketMessage,
    onStatusChange: setWsStatus,
    pingInterval: 30000,
  });

  // --- Actions ---
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
      setFeedback("Veuillez saisir un nom de groupe et sélectionner au moins un ami.");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "create_group",
      group_name: groupName.trim(),
      users_id: userIds,
    }));
  }, [socket]);

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

  const contextValue: ChatWebSocketContextType = {
    wsStatus,
    socket,
    groups,
    friends,
    groupMessages,
    sendMessage,
    loadMessages,
    createGroup,
    deleteGroup,
    feedback,
    setFeedback,
  };

  return (
    <ChatWebSocketContext.Provider value={contextValue}>
      {children}
    </ChatWebSocketContext.Provider>
  );
};