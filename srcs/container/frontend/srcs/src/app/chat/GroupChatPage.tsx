// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message } from "./types/chat";
import ChatContentArea from "./components/ChatContentArea";
import notification from "../components/Notifications";
import ApiService from "../../api/ApiService";
import { useTranslation } from 'react-i18next';

const GroupsMessagesPage: React.FC = () => {
    const {
        groups,
        friends,
        groupMessages,
        wsStatus,
        feedback,
        sendMessage,
        loadMessages,
        createGroup,
        deleteGroup,
    } = useChatWebSocket();
    const { t } = useTranslation();

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
    <aside className="w-64 bg-gray-100 border-r flex flex-col mt-16">
      <div className="p-4 font-bold text-xl">Groupes</div>

      {/* Section de création de groupe */}
      <div className="px-4 pb-2">
        <button
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          onClick={() => setShowCreateGroup(!showCreateGroup)}
        >
          {showCreateGroup ? "Annuler la création" : "Créer un groupe"}
        </button>

        {showCreateGroup && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              className="w-full p-2 border rounded text-sm"
              placeholder="Nom du groupe"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />

            <div className="text-xs font-semibold">Sélectionner des amis :</div>
            <div className="max-h-32 overflow-y-auto space-y-1 border p-1 rounded"> {/* Added border and padding */}
              {friends.length === 0 ? (
                <div className="text-xs text-gray-500">Aucun ami disponible pour la création de groupe.</div>
              ) : (
                (friends ?? []).map(f => (
                  <label key={f.id} className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFriendsForGroup.includes(f.id)}
                      onChange={() => toggleFriendSelection(f.id)}
                      className="form-checkbox" // Added class for styling
                    />
                    <span>{f.username}</span>
                  </label>
                ))
              )}
            </div>

            <button
              className="w-full p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || selectedFriendsForGroup.length === 0}
            >
              Créer
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto"> {/* Changed to overflow-y-auto */}
        {groups.map((g) => (
          
          <button
            key={g.id}
            className={`w-full text-left p-4 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 ${selectedGroup?.id === g.id ? "bg-blue-200 font-bold" : ""}`} // Improved focus and transition
            onClick={() => {
              setSelectedGroup(g);
            }}
          >
            {g.name || g.members.map(m => m.username).join(', ')} {/* Group name or member list for private chats */}
          </button>
        ))}
      </div>
    </aside>
            <ChatContentArea
                selectedGroup={selectedGroup}
                selectedMessages={selectedMessages}
                feedback={feedback}
                sendMessage={handleSendMessage}
                input={input}
                setInput={setInput}
            />
        </div>
    );
};

export default GroupsMessagesPage;