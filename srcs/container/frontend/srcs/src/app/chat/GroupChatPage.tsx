// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message } from "./types/chat";
// import ChatContentArea from "./components/ChatContentArea";
import notification from "../components/Notifications";
import ApiService from "../../api/ApiService";
import { useTranslation } from 'react-i18next';

const GroupsMessagesPage: React.FC = () => {
    const {
        groups,
        friends,
        groupMessages,
        sendMessage,
        loadMessages,
        createGroup,
        deleteGroup,
        currentUserId,
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
    }, [newGroupName, selectedFriendsForGroup, createGroup]);

    const toggleFriendSelection = useCallback((friendId: number) => {
        setSelectedFriendsForGroup(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    }, []);

  function NoMessage() {
    return (
      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
      <div className="text-center text-gray-500 mt-8">Aucun message dans cette conversation.</div></div>
    )
  }


  function Messages() {
    return (
      <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
        {selectedMessages.map((m, idx) => (
          <div
            key={m.id ?? idx}
            className={`max-w-xl ${m.sender_id === currentUserId || m.sender_id === "moi"
              ? "ml-auto bg-blue-200"
              : "mr-auto bg-white"
              } p-2 rounded shadow`}
          >
            <div>{m.sender_id === currentUserId || m.sender_id === "moi" ? "moi" : m.sender_id}: {m.message}</div> {/* Peut-être afficher le nom de l'expéditeur si disponible */}
            <div className="text-xs text-gray-500 text-right">
              {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""}
            </div>
          </div>
        ))}
      </div>
    );
  }

    function renderContent () {
    if(selectedMessages.length === 0){
      return (
        <NoMessage />
      )
    }
    else{
     return (
        <Messages />
      )
    }
  };

    return (
        <div className="flex">
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
    <main className="flex-1 flex flex-col mt-16">
      <header className="p-4 border-b font-semibold text-lg text-gray-500">
        {
          selectedGroup
            ? `Discussion de groupe : ${selectedGroup.name || selectedGroup.members.map(m => m.username).join(', ')}`
            : "Sélectionnez un groupe..."
        }
      </header>
      {renderContent()}
      {selectedGroup && (
        <footer className="p-4 border-t flex space-x-2">
          <input
            type="text"
            className="flex-1 border rounded p-2 text-gray-500"
            placeholder="Tape un message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
          />
          <button
            className="bg-blue-500 text-gray-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
          >
            Envoyer
          </button>
        </footer>
      )}
    </main>
        </div>
    );
};

export default GroupsMessagesPage;