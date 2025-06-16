// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import useSafeWebSocket, { WebSocketStatus } from "../../api/useSafeWebSocket";
import { Group, Message, Friend } from "./types/chat";
import ChatSidebar from "./components/ChatSidebar";
import ChatContentArea from "./components/ChatContentArea";

const endpoint = `/chat`;

const GroupsMessagesPage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupMessages, setGroupMessages] = useState<{ [groupId: number]: Message[] }>({});
    const [input, setInput] = useState("");
    const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
    const [feedback, setFeedback] = useState<string | null>(null);

    // Création de groupe
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<number[]>([]);

    // Messages du groupe actuellement sélectionné
    const selectedMessages: Message[] = selectedGroup ? groupMessages[selectedGroup.id] || [] : [];

    // --- Gestion des messages WebSocket ---
    const handleWebSocketMessage = useCallback((data: any) => {
        console.log("data", data);
        switch (data.action) {
            case "new_message":
                if (data.group_id && data.result === "ok" && data.message) {
                    setGroupMessages(prev => ({
                        ...prev,
                        [data.group_id]: [...(prev[data.group_id] || []), data.message]
                    }));
                }
                console.log("FRIENDS", data.friends)
                if (data.friends) setFriends(prev => [...prev, data.friends]);
                break;
            case "loadMoreMessage":
                if (data.messages && data.group_id) {
                    const arr = Object.values(data.messages) as Message[];
                    arr.sort((a, b) => a.id - b.id);


                    for (const key in arr) {
                        const sender_id = arr[key].sender_id;
                        const username = friends.find(f => f.id === sender_id)?.username
                        console.log("idmessage", username, sender_id, arr[key].message);
                        console.log(friends);
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
                if (groupArray.length > 0) setSelectedGroup(groupArray[0]);
                console.log("FRIENDS", data.friends);
                const groupFriends: Friend[] = Object.values(data.friends || {});
                if (groupFriends.length > 0) setFriends(groupFriends);
                console.log("FRIENDS2", groupFriends);
                break;
            }
            case "create_group": {
                if (data.result === "ok" && data.group) {
                    setGroups(prev => [...prev, data.group]);
                    setFeedback("Groupe créé avec succès !");
                    setSelectedGroup(data.group);
                    setShowCreateGroup(false);
                    setNewGroupName("");
                    setSelectedFriendsForGroup([]);
                } else {
                    setFeedback(data.error || "Erreur lors de la création du groupe.");
                }
                setTimeout(() => setFeedback(null), 2000);
                break;
            }
            //   case "group_updated": {
            //     if (data.group) {
            //       setGroups(prev => prev.map(g => g.id === data.group.id ? data.group : g));
            //       if (selectedGroup?.id === data.group.id) setSelectedGroup(data.group);
            //     }
            //     break;
            //   }
            case "delete_group": {
                if (data.group_id) {
                    setGroups(prev => prev.filter(g => g.id !== data.group_id));
                    if (selectedGroup?.id === data.group_id) setSelectedGroup(null);
                }
                break;
            }
            default:
                // Actions autres ignorées dans ce contexte
                break;
        }
    }, [selectedGroup]);

    // --- Configuration WebSocket ---
    const socket = useSafeWebSocket({
        endpoint,
        onMessage: handleWebSocketMessage,
        onStatusChange: setWsStatus,
        reconnectDelay: 1000,
        maxReconnectAttempts: 15,
        pingInterval: 30000,
    });

    // Charger les messages quand un groupe est sélectionné
    useEffect(() => {
        if (socket?.readyState !== WebSocket.OPEN || !selectedGroup) return;
        socket.send(
            JSON.stringify({
                action: "loadMoreMessage",
                group_id: selectedGroup.id,
                firstMessageId: 0,
            })
        );
    }, [selectedGroup, socket]);



    // Envoyer un message
    const sendMessage = () => {
        if (!input.trim() || !selectedGroup || socket?.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
            action: "new_message",
            group_id: selectedGroup.id,
            message: input,
        }));
        setInput("");
    };

    // Gérer création de groupe
    const handleCreateGroup = () => {
        if (!newGroupName.trim() || selectedFriendsForGroup.length === 0 || socket?.readyState !== WebSocket.OPEN) {
            setFeedback("Veuillez saisir un nom de groupe et sélectionner au moins un ami.");
            setTimeout(() => setFeedback(null), 2000);
            return;
        }
        setFeedback(null);
        socket.send(JSON.stringify({
            action: "create_group",
            group_name: newGroupName.trim(),
            users_id: selectedFriendsForGroup,
        }));
    };

    const toggleFriendSelection = useCallback((friendId: number) => {
        setSelectedFriendsForGroup(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    }, []);

    return (
        <div className="flex h-screen">
            <ChatSidebar
                groups={groups}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                wsStatus={wsStatus}
                showCreateGroup={showCreateGroup}
                setShowCreateGroup={setShowCreateGroup}
                newGroupName={newGroupName}
                setNewGroupName={setNewGroupName}
                selectedFriendsForGroup={selectedFriendsForGroup}
                toggleFriendSelection={toggleFriendSelection}
                handleCreateGroup={handleCreateGroup}
                friends={setFriends}
            />
            <ChatContentArea
                selectedGroup={selectedGroup}
                selectedMessages={selectedMessages}
                feedback={feedback}
                wsStatus={wsStatus}
                sendMessage={sendMessage}
                input={input}
                setInput={setInput}
            />
        </div>
    );
};

export default GroupsMessagesPage;
