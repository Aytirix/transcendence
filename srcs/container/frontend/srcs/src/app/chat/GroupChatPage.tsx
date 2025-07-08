// src/GroupsMessagesPage.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import { Group, Message } from "./types/chat";
import ApiService from "../../api/ApiService";
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import "../assets/styles/chat.scss";

const GroupsMessagesPage: React.FC = () => {
	const {
		groups,
		friends,
		setInputSearch,
		groupMessages,
		sendMessage,
		loadMessages,
		createGroup,
		deleteGroup,
		addUserToGroup,
		removeUserFromGroup,
		currentUserId,
	} = useChatWebSocket();
	const { t } = useLanguage();
	const { user } = useAuth();

	// État local pour l'interface utilisateur
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
	const [input, setInput] = useState("");
	const [searchQuery, setSearchQuery] = useState('');

	// Dériver selectedGroup depuis les groupes du contexte pour qu'il se mette à jour automatiquement
	const selectedGroup = useMemo(() => {
		if (!selectedGroupId) return null;
		return groups.find(g => g.id === selectedGroupId) || null;
	}, [groups, selectedGroupId]);

	// Création de groupe
	const [showCreateGroup, setShowCreateGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");
	const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<number[]>([]);
	
	// Gestion de groupe (ajout/suppression de membres)
	const [showGroupManagement, setShowGroupManagement] = useState(false);
	const [managingGroup, setManagingGroup] = useState<Group | null>(null);
	
	// Sidebar visibility state
	const [sidebarVisible, setSidebarVisible] = useState(true);

	// Messages du groupe actuellement sélectionné
	const selectedMessages: Message[] = selectedGroup ? groupMessages[selectedGroup.id] || [] : [];

	// Sélectionner automatiquement le premier groupe lors du chargement
	useEffect(() => {
		if (groups.length > 0 && !selectedGroup) {
			setSelectedGroupId(groups[0].id);
		}
	}, [groups, selectedGroup]);

	// Détecter les nouveaux groupes privés et les sélectionner automatiquement
	const prevGroupsLength = useRef(groups.length);
	useEffect(() => {
		// Si un nouveau groupe a été ajouté
		if (groups.length > prevGroupsLength.current) {
			const newGroups = groups.slice(prevGroupsLength.current);
			// Chercher un groupe privé parmi les nouveaux groupes
			const newPrivateGroup = newGroups.find(g => g.private);
			if (newPrivateGroup) {
				console.log("Auto-selecting new private group:", newPrivateGroup);
				setSelectedGroupId(newPrivateGroup.id);
			}
		}
		prevGroupsLength.current = groups.length;
	}, [groups]);

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

	const toggleUserSelection = useCallback((userId: number) => {
		setSelectedUsersForGroup(prev =>
			prev.includes(userId)
				? prev.filter(id => id !== userId)
				: [...prev, userId]
		);
	}, []);

	// Fonctions de gestion de groupe
	const handleAddUserToGroup = useCallback((groupId: number, userId: number) => {
		addUserToGroup(groupId, userId);
	}, [addUserToGroup]);

	const handleRemoveUserFromGroup = useCallback((groupId: number, userId: number) => {
		removeUserFromGroup(groupId, userId);
	}, [removeUserFromGroup]);

	const openGroupManagement = useCallback((group: Group) => {
		setManagingGroup(group);
		setShowGroupManagement(true);
	}, []);

	const closeGroupManagement = useCallback(() => {
		setManagingGroup(null);
		setShowGroupManagement(false);
	}, []);

	// Vérifier si l'utilisateur actuel est propriétaire du groupe
	const isGroupOwner = useCallback((group: Group) => {
		return group.owners_id && group.owners_id.includes(currentUserId || 0);
	}, [currentUserId]);

	// Obtenir les amis qui ne sont pas encore dans le groupe
	const getAvailableFriendsForGroup = useCallback((group: Group) => {
		if (!group) return [];
		const groupMemberIds = group.members.map(member => member.id);
		return friends
			.filter(friend => 
				friend.relation.status === "friend" && 
				!groupMemberIds.includes(friend.id)
			);
	}, [friends]);

	const NoMessage: React.FC = () => {
		return (
			<div className="chat-empty-state">
				<div className="chat-empty-state__icon">💬</div>
				<div className="chat-empty-state__title">{t('chat.noMessages')}</div>
				<div className="chat-empty-state__text">{t('chat.noMessagesInConversation')}</div>
			</div>
		)
	}

	function getAvatarById(id: string | number): string | undefined {
		// Si c'est l'utilisateur actuel, utiliser son avatar depuis le contexte
		if (id === currentUserId && user?.avatar) {
			return user.avatar;
		}
		
		const friend = friends.find(friend => friend.id === id);
		return friend?.avatar;
	}

	function getNameById(id: string | number): string | undefined {
		// Si c'est l'utilisateur actuel, utiliser son nom depuis le contexte
		if (id === currentUserId && user?.username) {
			return user.username;
		}
		
		const friend = friends.find(friend => friend.id === id);
		return friend?.username;
	}

	const Messages: React.FC = () => {
		return (
			<div className="chat-content__messages">
				{selectedMessages.map((m, idx) => {
					const isOwnMessage = m.sender_id === currentUserId;
					const senderName = getNameById(m.sender_id);
					
					const formatRelativeTime = (date: Date) => {
						const now = new Date();
						const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
						const diffInMinutes = Math.round(diffInSeconds / 60);
						const diffInHours = Math.round(diffInMinutes / 60);
						const diffInDays = Math.round(diffInHours / 24);

						if (diffInMinutes < 1) {
							return t('chat.now');
						} else if (diffInMinutes < 60) {
							return t('chat.minutesAgo', { count: diffInMinutes });
						} else if (diffInHours < 24) {
							return t('chat.hoursAgo', { count: diffInHours });
						} else if (diffInDays === 1) {
							return t('chat.yesterday');
						} else {
							return date.toLocaleString(undefined, {
								day: 'numeric',
								month: 'long',
								hour: '2-digit',
								minute: '2-digit'
							});
						}
					};

					return (
						<div
							key={m.id ?? idx}
							className={`chat-message ${isOwnMessage ? 'chat-message--own' : ''}`}
						>
							<div className="chat-message__avatar">
								<img
										src={ApiService.getFile(getAvatarById(m.sender_id))}
										alt={senderName}
										className="chat-avatar-image"
										onError={(e) => {
											(e.target as HTMLImageElement).src = ApiService.getFile(null);
										}}
								/>
								
							</div>
							
							<div className="chat-message__content">
								<div className="chat-message__header">
									<span className="chat-message__author">{senderName}</span>
									<time className="chat-message__time">
										{m.sent_at ? formatRelativeTime(new Date(m.sent_at)) : ""}
									</time>
								</div>
								<div className="chat-message__bubble">{m.message}</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const renderContent = () => {
		if (selectedMessages.length === 0) {
			return <NoMessage />;
		}
		else {
			return <Messages />;
		}
	};

	const handleCreateGroup = async () => {
		// Vérification que les champs sont bien remplis
		if (!newGroupName.trim() || selectedUsersForGroup.length === 0) {
			return;
		}

		try {
			// Appel de la fonction de création du groupe
			await createGroup(newGroupName, selectedUsersForGroup);

			// Réinitialisation des états du formulaire
			setNewGroupName("");
			setSelectedUsersForGroup([]);
			setInputSearch("");
			setShowCreateGroup(false); // Hide form after creation
			
			// Note: Le nouveau groupe sera automatiquement sélectionné via l'effet dans useEffect
		} catch (error) {
			console.error('Error creating group:', error);
		}
	};

	const HeaderMessages: React.FC = () => {
		/* if (showCreateGroup) {
			return (
				<div className="chat-content__header">
					<div className="chat-content__header-info">
						<div className="chat-content__header-details">
							<div className="chat-content__header-name">
								{t('chat.createGroup')}
							</div>
						</div>
					</div>
				</div>
			);
		} */

		const displayName = selectedGroup ? getGroupDisplayName(selectedGroup) : t('chat.selectGroup');
		
		return (
			<div className="chat-content__header">
				<div className="chat-content__header-info">
					<div className="chat-content__header-details">
						<div className="chat-content__header-name">
							{selectedGroup ? (selectedGroup.private ? t('chat.discussionWith') : t('chat.groupDiscussion')) : ''}
							{displayName}
						</div>
						{/* Group management button for non-private groups where user is owner */}
						{selectedGroup && !selectedGroup.private && isGroupOwner(selectedGroup) && (
							<button
								className="chat-group-manage-btn"
								onClick={() => openGroupManagement(selectedGroup)}
								title={t('chat.manageGroup')}
							>
								⚙️ {t('chat.manage')}
							</button>
						)}
						{/* {!selectedGroup?.private && selectedGroup && (
							<div className="chat-content__header-status">
								{selectedGroup.members.length > 1 && 
									`${selectedGroup.members.length} ${selectedGroup.members.length > 1 ? t('chat.members') : t('chat.member')}`
								}
								{selectedGroup.onlines_id && selectedGroup.onlines_id.length > 0 && (
									<>
										{" • "}
										<span className="chat-online-indicator">
											{selectedGroup.onlines_id.length} {t('chat.onlineCount')}
										</span>
									</>
								)}
							</div>
						)} */}
					</div>
				</div>
				{/* Section des membres */}
                {selectedGroup && selectedGroup.members.length > 0 && (
                    <div className="chat-content__header-online">
                        <div className="chat-content__header-online-list">
                            {selectedGroup.members.map((member) => {
                                const isOnline = selectedGroup.onlines_id?.includes(member.id) || false;
                                return (
                                    <div 
                                        key={member.id} 
                                        className={`chat-content__header-online-member ${isOnline ? 'chat-content__header-online-member--online' : 'chat-content__header-online-member--offline'}`}
                                    >
                                        <span className="chat-content__header-online-name">
                                            {member.username}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
			</div>
		)
	}

	const memberGroup = useCallback((group: Group) => {
		for (let i = 0; i < group.members.length; i++) {
			const member = group.members[i];
			if (member.id === currentUserId) {
				continue;
			}
			else{
				return member;
			}
		}
	}, [currentUserId]);

	type GroupProps = {
		displayName: string;
		g: Group;
	};
	const GroupPrivate: React.FC<GroupProps> = ({ g }) => {
		const member = memberGroup(g);
		return (
			<>
				<div>
					{member?.avatar ? (
						<img
							src={ApiService.getFile(member.avatar)}
							alt={member.username}
							className="chat-avatar-image--medium"
							onError={(e) => {
								(e.target as HTMLImageElement).src = ApiService.getFile(null);
							}}
						/>
					) : (
						<svg fill="currentColor" viewBox="0 0 20 20" className="chat-icon-24">
							<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
						</svg>
					)}
				</div>
				<div className="chat-group-item__info">
					<div className="chat-group-item__name">
						{member?.username || t('chat.unknownUser')}
					</div>
				</div>

			</>
		)
	}
	const GroupPublic: React.FC<GroupProps> = ({ displayName, g }) => {
		return (
			<>
				<div className="chat-group-item__avatar">
					<svg fill="currentColor" viewBox="0 0 20 20" className="chat-icon-24">
						<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
					</svg>
				</div>
				
				{/* Informations du groupe */}
				<div className="chat-group-item__info">
					<div className="chat-group-item__name">
						{displayName}
					</div>
					<div className="chat-group-item__preview">
						{`${g.members.length} ${g.members.length > 1 ? t('chat.members') : t('chat.member')}`}
						{g.onlines_id && g.onlines_id.length > 0 && (
							<>
								{" • "}
								<span className="chat-online-indicator">
									{`${g.onlines_id.length} ${t('chat.onlineCount')}`}
								</span>
							</>
						)}
					</div>
				</div>
			</>
			)
		}

	// Fonction pour obtenir la date du dernier message d'un groupe
	const getLastMessageTime = useCallback((groupId: number): number => {
		const messages = groupMessages[groupId];
		if (!messages || messages.length === 0) return 0;
		
		const lastMessage = messages[messages.length - 1];
		return lastMessage.sent_at ? new Date(lastMessage.sent_at).getTime() : 0;
	}, [groupMessages]);

	// Fonction pour ouvrir directement la conversation d'un ami (une seule conversation par ami)
	const getGroupDisplayName = useCallback((group: Group): string => {
		// Si le groupe est privé, on utilise le nom du membre
		if (group.private) {
			const member = memberGroup(group);
			return member ? member.username : t('chat.groupNoName');
		}
		if (group.name) {
			return group.name;
		}
		return t('chat.groupNoName');
		
	}, [memberGroup, t]);


	// Fonction pour gérer la suppression de groupe (optimisée)
	const handleDeleteGroup = useCallback((group: Group, e: React.MouseEvent) => {
		e.stopPropagation(); // Empêche la sélection du groupe lors du clic sur supprimer
		deleteGroup(group.id);
	}, [deleteGroup]);

	const ListGroups: React.FC = () => {
		//const allGroups = sortGroupsByLastActivity(groups);
		
		return (
			<div className="chat-sidebar__list">
				{/* Liste des groupes publics uniquement */}
				{groups.length === 0 ? (
					<div className="chat-empty-state">
						<div className="chat-empty-state__icon">👥</div>
						<div className="chat-empty-state__title">{t('chat.noGroups')}</div>
						<div className="chat-empty-state__text">{t('chat.noGroupsAvailable')}</div>
					</div>
				) : (
					groups.map((g) => {
						const isSelected = selectedGroup?.id === g.id;
						const lastMessageTime = getLastMessageTime(g.id);
						const isRecentActivity = lastMessageTime && (Date.now() - lastMessageTime) < 5 * 60 * 1000; // 5 minutes
						
						return (
							<div
								key={g.id}
								className={`chat-group-item ${isSelected ? 'chat-group-item--active' : ''} ${isRecentActivity ? 'chat-group-item--recent' : ''} chat-group-item__container`}
								onClick={() => setSelectedGroupId(g.id)}
							>
								<div className="chat-group-item__content chat-group-item__main-content">
									{ g.private ? (
										<GroupPrivate displayName={getGroupDisplayName(g)} g={g} />
									) : (
										<GroupPublic displayName={g.name ?? ""} g={g} />
									)}
									
									
								</div>
								
								{/* Bouton supprimer à droite */}
								{ !g.private && (
									<button
										className="chat-group-item__delete-btn"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteGroup(g, e);
										}}
										title={t('chat.deleteGroup')}
									>
										<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								)}
							</div>
						);
					})
				)}
			</div>
		)
	}

	return (
		<div className="chat-page">
			{/* Sidebar pour les groupes */}
			<div className="chat-sidebar-container">
				{/* Toggle sidebar */}
				{!sidebarVisible && (
					<button
						className="chat-sidebar-toggle-button chat-sidebar-toggle-button--show"
						onClick={() => setSidebarVisible(true)}
						aria-label={t('chat.showSidebar')}
					>ᐅ</button>
				)}
				{sidebarVisible && (
					<button
						className="chat-sidebar-toggle-button chat-sidebar-toggle-button--hide"
						onClick={() => setSidebarVisible(false)}
						aria-label={t('chat.hideSidebar')}
					>ᐊ</button>
				)}
				<div className={sidebarVisible ? 'chat-sidebar-visible' : 'chat-sidebar-hidden'}>
					<aside className="chat-sidebar">
						<div className="chat-sidebar__header">
							<h1 className="chat-sidebar__header-title ">
								<span className="gradient-text">
								{t('chat.messages')}
								</span>
							</h1>
							
							{/* Barre de recherche */}
							<div className="chat-sidebar__header-search">
								<input
									type="text"
									placeholder={t('chat.search')}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
								<div className="chat-sidebar__header-search-icon">🔍</div>
							</div>
						</div>

					<div className="chat-sidebar__content">
						{/* Section de création de groupe */}
						<div className="chat-create-group-section">
							<button
								className={`chat-modal__button ${showCreateGroup ? 'chat-modal__button--secondary' : 'chat-modal__button--primary'} ${showCreateGroup ? 'chat-create-group-button--with-form' : 'chat-create-group-button'}`}
								onClick={() => setShowCreateGroup(!showCreateGroup)}
							>
								{showCreateGroup ? t('chat.cancelCreation') : t('chat.createGroup')}
							</button>

							{showCreateGroup && (
								<div className="chat-modal__form">
									<input
										type="text"
										className="chat-modal__input"
										placeholder={t('chat.groupName')}
										value={newGroupName}
										onChange={(e) => setNewGroupName(e.target.value)}
									/>

									<div className="chat-friend-selection-title">
										{t('chat.selectFriends')}
									</div>
									<div className="chat-friend-selection-container">
										{friends.length === 0 ? (
											<div className="chat-friend-selection-empty">
												{t('chat.noFriendsAvailableForGroup')}
											</div>
										) : (
											friends
												.filter(f => f.relation.status !== "blocked")
												.map(f =>  (
													<label key={f.id} className="chat-friend-selection-item">
														<input
															type="checkbox"
															checked={selectedUsersForGroup.includes(f.id)}
															onChange={() => toggleUserSelection(f.id)}
														/>
														<div className="chat-friend-avatar-small">
															<img 
																src={ApiService.getFile(f.avatar)} 
																alt={f.username}
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
										className="chat-modal__button chat-modal__button--primary chat-create-group-submit"
										onClick={handleCreateGroup}
										disabled={!newGroupName.trim() || selectedUsersForGroup.length === 0}
									>
										{t('chat.createTheGroup')}
									</button>
								</div>
							)}
						</div>
						
						<ListGroups />
					</div>

						{/* Indicateur de statut WebSocket */}
						<div className="chat-sidebar__status">
							<div className="chat-sidebar__status-indicator"></div>
							<span className="chat-sidebar__status-text">{t('chat.connected')}</span>
						</div>
					</aside>
				</div>
			</div>

			{/* Zone de contenu principal */}
			<div className="chat-content">
				<HeaderMessages />
				{renderContent()}
				
				{/* Zone de saisie */}
				<div className="chat-content__input">
					<div className="chat-content__input-container">
						<textarea
							className="chat-content__input-field chat-input-no-resize"
							placeholder={t("chat.messagePlaceholder")}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => { 
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendMessage();
								} 
							}}
							rows={1}
						/>
						<button
							className="chat-content__input-send"
							onClick={handleSendMessage}
							disabled={!selectedGroup || !input.trim()}
						>
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="chat-send-icon">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Group Management Modal */}
			{showGroupManagement && managingGroup && (
				<div className="chat-modal-overlay" onClick={closeGroupManagement}>
					<div className="chat-modal" onClick={(e) => e.stopPropagation()}>
						<div className="chat-modal__header">
							<h3>{t('chat.manageGroup')}: {managingGroup.name}</h3>
							<button className="chat-modal__close" onClick={closeGroupManagement}>
								×
							</button>
						</div>

						<div className="chat-modal__content">
							{/* Current Members Section */}
							<div className="chat-group-management-section">
								<h4>{t('chat.currentMembers')} ({managingGroup.members.length})</h4>
								<div className="chat-group-members-list">
									{managingGroup.members.map(member => (
										<div key={member.id} className="chat-group-member-item">
											<div className="chat-group-member-info">
												<div className="chat-friend-avatar-small">
													<img 
														src={ApiService.getFile(member.avatar)} 
														alt={member.username}
														onError={(e) => {
															(e.target as HTMLImageElement).src = ApiService.getFile(null);
														}}
													/>
												</div>
												<span>{member.username}</span>
												{managingGroup.owners_id.includes(member.id) && (
													<span className="chat-owner-badge">👑</span>
												)}
											</div>
											{/* Only show remove button if it's not the current user and not an owner */}
											{member.id !== currentUserId && !managingGroup.owners_id.includes(member.id) && (
												<button
													className="chat-remove-member-btn"
													onClick={() => handleRemoveUserFromGroup(managingGroup.id, member.id)}
													title={t('chat.removeMember')}
												>
													🗑️
												</button>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Add Members Section */}
							<div className="chat-group-management-section">
								<h4>{t('chat.addMembers')}</h4>
								<div className="chat-add-members-list">
									{getAvailableFriendsForGroup(managingGroup).length === 0 ? (
										<div className="chat-no-available-friends">
											{t('chat.noFriendsToAdd')}
										</div>
									) : (
										getAvailableFriendsForGroup(managingGroup).map(friend => (
											<div key={friend.id} className="chat-group-member-item">
												<div className="chat-group-member-info">
													<div className="chat-friend-avatar-small">
														<img 
															src={ApiService.getFile(friend.avatar)} 
															alt={friend.username}
															onError={(e) => {
																(e.target as HTMLImageElement).src = ApiService.getFile(null);
															}}
														/>
													</div>
													<span>{friend.username}</span>
												</div>
												<button
													className="chat-add-member-btn"
													onClick={() => handleAddUserToGroup(managingGroup.id, friend.id)}
													title={t('chat.addMember')}
												>
													➕
												</button>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GroupsMessagesPage;