// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message } from "./types/chat";
import ChatSidebar from "./components/ChatSidebar";
import ChatContentArea from "./components/ChatContentArea";

const GroupsMessagesPage: React.FC = () => {
    const {
        groups,
        friends,
        groupMessages,
        wsStatus,
        feedback,
        setFeedback,
        sendMessage,
        loadMessages,
        createGroup,
    } = useChatWebSocket();

    // État local pour l'interface utilisateur
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [input, setInput] = useState("");

    // Création de groupe
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<number[]>([]);

    // Messages du groupe actuellement sélectionné
    const selectedMessages: Message[] = selectedGroup ? groupMessages[selectedGroup.id] || [] : [];

    // Sélectionner automatiquement le premier groupe lors du chargement
    useEffect(() => {
        if (groups.length > 0 && !selectedGroup) {
            setSelectedGroup(groups[0]);
        }
    }, [groups, selectedGroup]);

    // Charger les messages quand un groupe est sélectionné
    useEffect(() => {
        if (selectedGroup) {
            loadMessages(selectedGroup.id, 0);
        }
    }, [selectedGroup, loadMessages]);

    // Envoyer un message
    const handleSendMessage = useCallback(() => {
        if (!input.trim() || !selectedGroup) return;
        
        sendMessage(selectedGroup.id, input);
        setInput("");
    }, [input, selectedGroup, sendMessage]);

    // Gérer création de groupe
    const handleCreateGroup = useCallback(() => {
        createGroup(newGroupName, selectedFriendsForGroup);
        
        // Réinitialiser le formulaire si la création réussit
        // (le contexte gère déjà le feedback)
        if (!feedback?.includes("Erreur")) {
            setShowCreateGroup(false);
            setNewGroupName("");
            setSelectedFriendsForGroup([]);
        }
    }, [newGroupName, selectedFriendsForGroup, createGroup, feedback]);

    const toggleFriendSelection = useCallback((friendId: number) => {
        setSelectedFriendsForGroup(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    }, []);

    // Mettre à jour le groupe sélectionné quand un nouveau groupe est créé
    useEffect(() => {
        if (feedback?.includes("succès") && groups.length > 0) {
            const newestGroup = groups[groups.length - 1];
            setSelectedGroup(newestGroup);
        }
    }, [feedback, groups]);

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
                friends={friends}
            />
            <ChatContentArea
                selectedGroup={selectedGroup}
                selectedMessages={selectedMessages}
                feedback={feedback}
                wsStatus={wsStatus}
                sendMessage={handleSendMessage}
                input={input}
                setInput={setInput}
            />
        </div>
    );
};

export default GroupsMessagesPage;