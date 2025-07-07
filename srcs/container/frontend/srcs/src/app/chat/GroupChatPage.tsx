// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message, Friend } from "./types/chat";
import ApiService from "../../api/ApiService";
import { useTranslation } from 'react-i18next';
import notification from "../components/Notifications";
import "../assets/styles/chat.scss";

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
    // État pour l'onglet actif (Conversations ou Amis)
    const [activeTab, setActiveTab] = useState<'conversations' | 'friends'>('conversations');
    const [searchQuery, setSearchQuery] = useState('');

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
            <div className="chat-empty-state">
                <div className="chat-empty-state__icon">💬</div>
                <div className="chat-empty-state__title">Aucun message</div>
                <div className="chat-empty-state__text">Aucun message dans cette conversation.</div>
            </div>
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
            <div className="chat-content__messages">
                {selectedMessages.map((m, idx) => {
                    const isOwnMessage = m.sender_id === currentUserId;
                    const senderName = isOwnMessage ? "Moi" : getNameById(m.sender_id);
                    const senderAvatar = getAvatarById(m.sender_id);
                    
                    return (
                        <div
                            key={m.id ?? idx}
                            className={`chat-message ${isOwnMessage ? 'chat-message--own' : ''}`}
                        >
                            <div className="chat-message__avatar">
                                {senderAvatar ? (
                                    <img
                                        src={ApiService.getFile(getAvatarById(m.sender_id))}
                                        alt={senderName || "User"}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = ApiService.getFile(null);
                                        }}
                                    />
                                ) : (
                                    <span>{(senderName || "U").charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            
                            <div className="chat-message__content">
                                <div className="chat-message__header">
                                    <span className="chat-message__author">{senderName}</span>
                                    <time className="chat-message__time">
                                        {m.sent_at ? new Date(m.sent_at).toLocaleString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : ""} </time>
                                </div>
                                <div className="chat-message__bubble">{m.message}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderContent = useMemo(() => {
        if (selectedMessages.length === 0) {
            return <NoMessage />;
        }
        else {
            return <Messages />;
        }
    }, [selectedMessages.length]);
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
        const displayName = selectedGroup ? getGroupDisplayName(selectedGroup) : "Sélectionnez un groupe...";
        const isPrivate = selectedGroup?.private === true;
        
        return (
            <div className="chat-content__header">
                <div className="chat-content__header-info">
                    <div className="chat-content__header-details">
                        <div className="chat-content__header-name">
                            {selectedGroup ? `Discussion de groupe : ${displayName}` : "Sélectionnez un groupe..."}
                        </div>
                        {selectedGroup && (
                            <div className="chat-content__header-status">
                                {!isPrivate && selectedGroup.members.length > 1 && 
                                    `${selectedGroup.members.length} membre${selectedGroup.members.length > 1 ? 's' : ''}`
                                }
                                {selectedGroup.onlines_id && selectedGroup.onlines_id.length > 0 && (
                                    <>
                                        {!isPrivate && " • "}
                                        <span style={{ color: 'var(--chat-success)' }}>
                                            {isPrivate ? "En ligne" : `${selectedGroup.onlines_id.length} en ligne`}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
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

    const menberGroup = useCallback((group: any) => {
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
    }, [currentUserId]);

    // Fonction pour obtenir la date du dernier message d'un groupe
    const getLastMessageTime = useCallback((groupId: number): number => {
        const messages = groupMessages[groupId];
        if (!messages || messages.length === 0) return 0;
        
        const lastMessage = messages[messages.length - 1];
        return lastMessage.sent_at ? new Date(lastMessage.sent_at).getTime() : 0;
    }, [groupMessages]);

    // Filtrer les amis en fonction de la recherche et les trier par activité (optimisé avec useMemo et throttle)
    const filteredFriends = useMemo(() => {
        const filteredList = searchQuery.trim() 
            ? friends.filter(friend =>
                friend.username.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : friends;
        
        // Trier les amis par dernière activité de conversation
        return filteredList.sort((a, b) => {
            const groupA = groups.find(g => {
                if (g.private !== true) return false;
                const memberA = menberGroup(g);
                return memberA && memberA.id === a.id;
            });
            
            const groupB = groups.find(g => {
                if (g.private !== true) return false;
                const memberB = menberGroup(g);
                return memberB && memberB.id === b.id;
            });
            
            const timeA = groupA ? getLastMessageTime(groupA.id) : 0;
            const timeB = groupB ? getLastMessageTime(groupB.id) : 0;
            
            // Si les deux ont des conversations, trier par date
            if (timeA && timeB) return timeB - timeA;
            // Sinon, les amis avec conversations en premier
            if (timeA && !timeB) return -1;
            if (!timeA && timeB) return 1;
            // Pour les amis sans conversation, trier par statut en ligne puis nom
            if (a.online && !b.online) return -1;
            if (!a.online && b.online) return 1;
            return a.username.localeCompare(b.username);
        });
    }, [friends, searchQuery, groups, menberGroup, getLastMessageTime]);

    // État pour éviter les créations multiples de conversations
    const [creatingConversationWith, setCreatingConversationWith] = useState<number | null>(null);

    // Fonction pour ouvrir directement la conversation d'un ami (une seule conversation par ami)
    const getGroupDisplayName = useCallback((group: Group): string => {
        if (group.private === true) {
            const member = menberGroup(group);
            return member ? member.username : group.name || 'Groupe privé';
        }
        return group.name || 'Groupe sans nom';
    }, [menberGroup]);

    // Fonction pour trier les groupes par dernière activité
    const sortGroupsByLastActivity = useCallback((groupsToSort: Group[]) => {
        return [...groupsToSort].sort((a, b) => {
            const timeA = getLastMessageTime(a.id);
            const timeB = getLastMessageTime(b.id);
            return timeB - timeA; // Plus récent en premier
        });
    }, [getLastMessageTime]);

    // Fonction pour formater le temps relatif (ex: "il y a 5 min")
    const formatRelativeTime = useCallback((timestamp: number): string => {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'à l\'instant';
        if (minutes < 60) return `il y a ${minutes}min`;
        if (hours < 24) return `il y a ${hours}h`;
        if (days < 7) return `il y a ${days}j`;
        return new Date(timestamp).toLocaleDateString('fr-FR');
    }, []);

    // Fonction pour gérer la suppression de groupe (optimisée)
    const handleDeleteGroup = useCallback((group: Group, e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche la sélection du groupe lors du clic sur supprimer
        deleteGroup(group.id);
    }, [deleteGroup]);

    const ListGroups: React.FC = () => {
        // Filtrer et trier pour ne montrer que les groupes non-privés (groupes publics)
        const publicGroups = sortGroupsByLastActivity(groups.filter(g => g.private !== true));
        
        return (
            <div className="chat-sidebar__list">
                {/* Liste des groupes publics uniquement */}
                {publicGroups.length === 0 ? (
                    <div className="chat-empty-state">
                        <div className="chat-empty-state__icon">👥</div>
                        <div className="chat-empty-state__title">Aucun groupe</div>
                        <div className="chat-empty-state__text">Aucun groupe disponible</div>
                    </div>
                ) : (
                    publicGroups.map((g) => {
                        const displayName = getGroupDisplayName(g);
                        const isSelected = selectedGroup?.id === g.id;
                        const lastMessageTime = getLastMessageTime(g.id);
                        const relativeTime = formatRelativeTime(lastMessageTime);
                        const isRecentActivity = lastMessageTime && (Date.now() - lastMessageTime) < 5 * 60 * 1000; // 5 minutes
                        
                        return (
                            <div
                                key={g.id}
                                className={`chat-group-item ${isSelected ? 'chat-group-item--active' : ''} ${isRecentActivity ? 'chat-group-item--recent' : ''}`}
                                onClick={() => setSelectedGroup(g)}
                                data-index={g.id % 4} // Pour les variations de couleurs
                            >
                                <div className="chat-group-item__content">
                                    {/* Avatar ou icône pour groupe public */}
                                    <div className="chat-group-item__avatar">
                                        <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '24px', height: '24px' }}>
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                        </svg>
                                    </div>
                                    
                                    {/* Informations du groupe */}
                                    <div className="chat-group-item__info">
                                        <div className="chat-group-item__name">
                                            {displayName}
                                        </div>
                                        <div className="chat-group-item__preview">
                                            {`${g.members.length} membre${g.members.length > 1 ? 's' : ''}`}
                                            {g.onlines_id && g.onlines_id.length > 0 && (
                                                <>
                                                    {" • "}
                                                    <span style={{ color: 'var(--chat-success)' }}>
                                                        {`${g.onlines_id.length} en ligne`}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Meta informations */}
                                    <div className="chat-group-item__meta">
                                        {relativeTime && (
                                            <div className="chat-group-item__time">
                                                {relativeTime}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <button
									className="chat-group-item__menu-dropdown-item chat-group-item__menu-dropdown-item--danger"
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteGroup(g, e);
										setOpenMenuId(null);
									}}
								>
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Supprimer le groupe
								</button>
                            </div>
                        );
                    })
                )}
            </div>
        )
    }

    // Composant pour afficher la liste d'amis (optimisé avec React.memo)
    const ListFriends: React.FC = React.memo(() => {
        // Fonction pour obtenir le groupe privé d'un ami s'il existe
        const getPrivateGroupForFriend = useCallback((friendId: number) => {
            return groups.find(g => {
                if (g.private !== true) return false;
                const otherMember = menberGroup(g);
                return otherMember && otherMember.id === friendId;
            });
        }, [groups, menberGroup]);

        // Fonction pour ouvrir directement la conversation d'un ami
        const openFriendConversation = useCallback((friend: Friend) => {
            // Éviter les créations multiples
            if (creatingConversationWith === friend.id) {
                return;
            }

            const existingGroup = getPrivateGroupForFriend(friend.id);
            
            if (existingGroup) {
                // Ouvrir la conversation existante
                setSelectedGroup(existingGroup);
            } else {
                // Marquer qu'on est en train de créer une conversation
                setCreatingConversationWith(friend.id);
                
                // Créer une nouvelle conversation privée
                createGroup(`Conversation avec ${friend.username}`, [friend.id]);
                
                // Réinitialiser l'état après un délai
                setTimeout(() => {
                    setCreatingConversationWith(null);
                }, 1000);
            }
            
            // Basculer vers l'onglet conversations pour voir la discussion
            setActiveTab('conversations');
        }, [getPrivateGroupForFriend, createGroup, setActiveTab, creatingConversationWith]);

        return (
            <div className="chat-sidebar__list">
                {/* Section des amis */}
                <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--chat-text-muted)', borderBottom: '1px solid var(--chat-border)' }}>
                    Amis ({filteredFriends.length})
                </div>
                
                {filteredFriends.length === 0 ? (
                    <div className="chat-empty-state">
                        <div className="chat-empty-state__icon">👥</div>
                        <div className="chat-empty-state__title">
                            {friends.length === 0 ? "Aucun ami" : "Aucun résultat"}
                        </div>
                        <div className="chat-empty-state__text">
                            {friends.length === 0 
                                ? "Ajoutez des amis pour commencer à discuter" 
                                : "Aucun ami ne correspond à votre recherche"
                            }
                        </div>
                    </div>
                ) : (
                    filteredFriends.map((friend, index) => {
                        const displayName = friend.username || `Ami ${friend.id}`;
                        const isOnline = friend.online;
                        const statusText = isOnline ? "En ligne" : "Hors ligne";
                        const hasActiveConversation = getPrivateGroupForFriend(friend.id);
                        const privateGroup = hasActiveConversation;
                        const isSelected = privateGroup && selectedGroup?.id === privateGroup.id;
                        const isCreatingConversation = creatingConversationWith === friend.id;
                        const lastMessageTime = privateGroup ? getLastMessageTime(privateGroup.id) : 0;
                        const relativeTime = formatRelativeTime(lastMessageTime);
                        
                        return (
                            <div
                                key={friend.id}
                                className={`chat-friend-item ${isSelected ? 'chat-friend-item--active' : ''} ${isOnline ? 'chat-friend-item--online' : ''} ${isCreatingConversation ? 'chat-friend-item--creating' : ''}`}
                                data-index={index % 4}
                                onClick={() => openFriendConversation(friend)}
                            >
                                <div className="chat-friend-item__content">
                                    {/* Avatar */}
                                    <div className={`chat-friend-item__avatar ${isOnline ? 'chat-friend-item__avatar--online' : 'chat-friend-item__avatar--offline'}`}>
                                        {friend.avatar ? (
                                            <img 
                                                src={ApiService.getFile(friend.avatar)} 
                                                alt={displayName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const parent = (e.target as HTMLElement).parentElement;
                                                    if (parent) parent.textContent = displayName.charAt(0).toUpperCase();
                                                }}
                                            />
                                        ) : (
                                            displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    {/* Informations */}
                                    <div className="chat-friend-item__info">
                                        <div className="chat-friend-item__name">{displayName}</div>
                                        <div className="chat-friend-item__status">
                                            <span className={`chat-friend-item__status-badge chat-friend-item__status-badge--${isOnline ? 'online' : 'offline'}`}>
                                                {statusText}
                                            </span>
                                            {friend.relation.status === 'pending' && (
                                                <span className="chat-friend-item__status-badge chat-friend-item__status-badge--pending">
                                                    En attente
                                                </span>
                                            )}                                            {hasActiveConversation && (
                                                <span className="chat-friend-item__status-badge chat-friend-item__status-badge--conversation">
                                                    💬 Conversation {relativeTime && `• ${relativeTime}`}
                                                </span>
                                            )}
                                            {isCreatingConversation && (
                                                <span className="chat-friend-item__status-badge chat-friend-item__status-badge--creating">
                                                    ⏳ Création...
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Menu à trois points pour les amis */}
                                    {friend.relation.status === 'friend' && (
                                        <div className="chat-friend-item__menu">
                                            <button
                                                className="chat-friend-item__menu-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === friend.id ? null : friend.id);
                                                }}
                                            >
                                                <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '16px', height: '16px' }}>
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                                </svg>
                                            </button>
                                            
                                            {openMenuId === friend.id && (
                                                <div className="chat-friend-item__menu-dropdown"
                                                     onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        className="chat-friend-item__menu-dropdown-item"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            testInvitePong(friend);
                                                            setOpenMenuId(null);
                                                        }}
                                                    >
                                                        <img src="/images/intro/floating-pong.png" alt="Pong" style={{ width: '16px', height: '16px' }} />
                                                        Inviter au Pong
                                                    </button>
                                                    {hasActiveConversation && (
                                                        <button
                                                            className="chat-friend-item__menu-dropdown-item chat-friend-item__menu-dropdown-item--danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteGroup(privateGroup!, e);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Supprimer la conversation
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions pour les demandes d'ami */}
                                    {friend.relation.status === 'pending' && friend.relation.target === currentUserId && (
                                        <div className="chat-friend-item__actions">
                                            <button
                                                className="chat-friend-item__action-button chat-friend-item__action-button--accept"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: Implémenter accepter demande d'ami
                                                }}
                                            >
                                                Accepter
                                            </button>
                                            <button
                                                className="chat-friend-item__action-button chat-friend-item__action-button--decline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: Implémenter refuser demande d'ami
                                                }}
                                            >
                                                Refuser
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    });

    return (
        <div className="chat-page">
            {/* Sidebar pour les groupes et amis */}
            <aside className="chat-sidebar">
                <div className="chat-sidebar__header">
                    <h1 className="chat-sidebar__header-title">Messages</h1>
                    
                    {/* Onglets Conversations / Amis */}
                    <div className="chat-sidebar__header-tabs">
                        <button 
                            className={`chat-sidebar__header-tab ${activeTab === 'conversations' ? 'chat-sidebar__header-tab--active' : ''}`}
                            onClick={() => setActiveTab('conversations')}
                        >
                            Conversations
                        </button>
                        <button 
                            className={`chat-sidebar__header-tab ${activeTab === 'friends' ? 'chat-sidebar__header-tab--active' : ''}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            Amis
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="chat-sidebar__header-search">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="chat-sidebar__header-search-icon">🔍</div>
                    </div>
                </div>

                <div className="chat-sidebar__content">
                    {/* Section de création de groupe */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--chat-border)' }}>
                        <button
                            className={`chat-modal__button ${showCreateGroup ? 'chat-modal__button--secondary' : 'chat-modal__button--primary'}`}
                            style={{ width: '100%', marginBottom: showCreateGroup ? '1rem' : '0' }}
                            onClick={() => setShowCreateGroup(!showCreateGroup)}
                        >
                            {showCreateGroup ? "Annuler la création" : "Créer un groupe"}
                        </button>

                        {showCreateGroup && (
                            <div className="chat-modal__form">
                                <input
                                    type="text"
                                    className="chat-modal__input"
                                    placeholder="Nom du groupe"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                />

                                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                    Sélectionner des amis :
                                </div>
                                <div style={{ maxHeight: '128px', overflowY: 'auto', border: '1px solid var(--chat-border)', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                    {friends.length === 0 ? (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--chat-text-muted)' }}>
                                            Aucun ami disponible pour la création de groupe.
                                        </div>
                                    ) : (
                                        friends.map(f => (
                                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFriendsForGroup.includes(f.id)}
                                                    onChange={() => toggleFriendSelection(f.id)}
                                                />
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img 
                                                        src={ApiService.getFile(f.avatar)} 
                                                        alt={f.username}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = ApiService.getFile(null);
                                                        }}
                                                    />
                                                </div>
                                                <span>{f.username}</span>
                                            </label>
                                        ))
                                    )}
                                </div>

                                <button
                                    className="chat-modal__button chat-modal__button--primary"
                                    style={{ width: '100%' }}
                                    onClick={handleCreateGroup}
                                    disabled={!newGroupName.trim() || selectedFriendsForGroup.length === 0}
                                >
                                    Créer le groupe
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Liste des groupes ou amis selon l'onglet actif */}
                    {activeTab === 'conversations' ? (
                        <ListGroups />
                    ) : (
                        <ListFriends />
                    )}
                </div>

                {/* Indicateur de statut WebSocket */}
                <div className="chat-sidebar__status">
                    <div className="chat-sidebar__status-indicator"></div>
                    <span className="chat-sidebar__status-text">Connecté</span>
                </div>
            </aside>

            {/* Zone de contenu principal */}
            <div className="chat-content">
                <HeaderMessages />
                {renderContent}
                
                {/* Zone de saisie */}
                <div className="chat-content__input">
                    <div className="chat-content__input-container">
                        <textarea
                            className="chat-content__input-field"
                            placeholder={t("tape_un_message")}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { 
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                } 
                            }}
                            rows={1}
                            style={{ resize: 'none' }}
                        />
                        <button
                            className="chat-content__input-send"
                            onClick={handleSendMessage}
                            disabled={!selectedGroup || !input.trim()}
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupsMessagesPage;