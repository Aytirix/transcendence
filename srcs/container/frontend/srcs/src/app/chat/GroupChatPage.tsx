// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message, Member } from "./types/chat";
import ApiService from "../../api/ApiService";
import { useTranslation } from 'react-i18next';
import notification from "../components/Notifications";

const GroupsMessagesPage: React.FC = () => {
    const {
        groups,
        friends,
        groupMessages,
        sendMessage,
        loadMessages,
        createGroup,
        deleteGroup,
        handleCancelInvite,
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

    const toggleFriendSelection = useCallback((friendId: number) => {
        setSelectedFriendsForGroup(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    }, []);

    const NoMessage: React.FC = () => {
        return (
            <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                <div className="text-center text-gray-500 mt-8">Aucun message dans cette conversation.</div></div>
        )
    }
    function getAvatarById(id: any): string | undefined {
        const friend = friends.find(friend => friend.id === id);
        return friend?.avatar;
    }
    function getNameById(id: any): string | undefined {
        const friend = friends.find(friend => friend.id === id);
        return friend?.username;
    }
    const Messages: React.FC = () => {
        return (
            <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                {selectedMessages.map((m, idx) => (
                    <div
                        key={m.id ?? idx}
                        className={`chat ${m.sender_id === currentUserId
                            ? "chat chat-end"
                            : "chat chat-start"
                            }`}
                    >
                        <div className="chat-image avatar">
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Tailwind CSS chat bubble component"
                                    src={ApiService.getFile(getAvatarById(m.sender_id))}
                                />
                            </div>
                        </div>
                        <div className="chat-header">
                            {m.sender_id === currentUserId ? "moi" : getNameById(m.sender_id)}
                            <time className="text-xs opacity-50">{m.sent_at ? new Date(m.sent_at).toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : ""}</time>
                        </div>
                        <div className="chat-bubble">{m.message}</div>
                    </div>
                ))}
            </div>
        );
    }

    const RenderContent: React.FC = () => {
        if (selectedMessages.length === 0) {
            return (
                <NoMessage />
            )
        }
        else {
            return (
                <Messages />
            )
        }
    };
    const handleCreateGroup = () => {
        // Vérification que les champs sont bien remplis
        if (!newGroupName.trim() || selectedFriendsForGroup.length === 0) {
            return;
        }

        // Appel de la fonction de création du groupe
        createGroup(newGroupName, selectedFriendsForGroup);

        // Réinitialisation des états du formulaire
        setNewGroupName("");
        setSelectedFriendsForGroup([]);
        setShowCreateGroup(false); // Masque le formulaire après la création
    };

    const HeaderMessages: React.FC = () => {
        let member2;
        if(selectedGroup)
            member2 = menberGroup(selectedGroup);
        return (
            <header className="p-4 border-b font-semibold text-lg text-gray-500">
                {
                    selectedGroup
                        ? `Discussion de groupe : ${selectedGroup.name || member2.username}`
                        : "Sélectionnez un groupe..."
                }
            </header>
        )
    }

    async function testInvitePong(friend: any) {
        const response = await ApiService.post(`/pong/invitePlayer`, { friendId: friend.id });
        if (response.ok) {
            notification.cancel(`${t('friendPage.notifications.PonginviteSent', { username: friend.username })}`).then(() => {
                handleCancelInvite(response.token);
            });
        }
        return response;
    }

    function menberGroup(group: any)
    {
        for (let i = 0; i < group.members.length; i++) {
            const member = group.members[i];
            if (member.id === currentUserId) {
                console.log(`L'utilisateur ${member.username} est l'utilisateur actuel (trouvé à l'index ${i}).`);
                continue;
            }
            else{
                return member;
            }
        }
    }

    const GroupPrivate: React.FC = ({ group }: any) => {
        const member = menberGroup(group);
        return (
            <div className="w-full flex gap-4">
                <div

                    className={`flex-shrink-0 ${selectedGroup?.id === group.id ? "font-bold text-white" : "text-white"}`} // Improved focus and transition

                >
                    {member.username} {/* Group name or member list for private chats */}
                </div>
                <div className="flex gap-2">
                    <button
                        title="Pong test Invite"
                        className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
                        onClick={() => testInvitePong(member)}
                    >
                        <img src="/images/intro/floating-pong.png" alt="Pong test Invite" className="w-7 h-7" />
                    </button>

                </div>
            </div>
        )
    }

    const GroupeNoPrivate: React.FC = ({ group }: any) => {
        return (
            <div className="w-full flex gap-4">
                <div

                    className={`flex-shrink-0 ${selectedGroup?.id === group.id ? "font-bold text-white" : "text-white"}`} >
                    {group.name}
                </div>
                <div className="flex gap-2">
                    <button
                        title={t('friendPage.tooltips.remove')}
                        className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
                        onClick={() => deleteGroup(group.id)}
                    >
                        <img src="/images/croix.png" alt={t('friendPage.tooltips.remove')} className="w-7 h-7" />
                    </button>

                </div>
            </div>
        )
    }

    const ListGroups: React.FC = () => {
        return (
            <div className="flex-1 overflow-y-auto"> {/* Changed to overflow-y-auto */}
                <ul className="space-y-3">
                    {groups.map((g) => (
                        <li className="bg-gray-800 bg-opacity-50 border border-gray-600 rounded-xl p-4 hover:bg-gray-700 hover:bg-opacity-50 transition-all duration-300" key={g.id} onClick={() => {
                            setSelectedGroup(g);
                        }} >
                            {g.private === true ?
                                <GroupPrivate group={g} /> :
                                <GroupeNoPrivate group={g} />}
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    return (
        <div className="flex">
            <aside className="w-64 bg-gray-100 border-r flex flex-col mt-16">
                <div className="p-4 font-bold text-xl">Groupes</div>

                {/* Section de création de groupe */}
                <div className="px-4 pb-2">
                    <button
                        className="w-full p-2 bg-green-500 rounded hover:bg-green-600 text-sm"
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
                                                className="form-checkbox"
                                            />
                                            <span>{f.username}</span>
                                        </label>
                                    ))
                                )}
                            </div>

                            <button
                                className="w-full p-1 bg-blue-500 rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleCreateGroup} // Utilisez la nouvelle fonction ici
                                disabled={!newGroupName.trim() || selectedFriendsForGroup.length === 0}
                            >
                                Créer
                            </button>
                        </div>
                    )}
                </div>
                <ListGroups />
            </aside>
            <div className="flex-1 flex flex-col mt-16">
                <HeaderMessages />
                <RenderContent />
                <footer className="p-4 border-t flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 border rounded p-2 text-gray-700"
                        placeholder={t("tape_un_message")}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                        aria-label={t("tape_un_message")}
                    />
                    <button
                        className="bg-blue-500 text-gray-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSendMessage}
                    >
                        Envoyer
                    </button>
                </footer>
            </div>
        </div>

    );
};

export default GroupsMessagesPage;