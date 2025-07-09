// src/contexts/ChatWebSocketContext.tsx

import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import useSafeWebSocket, { WebSocketStatus } from '../../api/useSafeWebSocket';
import { Group, Message, Friend } from './types/chat';
import notification from '../components/Notifications'
import { useSafeLanguage } from '../../contexts/LanguageContext';

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
	searchResults: Friend[];
	inputSearch: string;
	setInputSearch: (value: string) => void;

	// Chat Actions
	sendMessage: (groupId: number, message: string) => void;
	loadMessages: (groupId: number, firstMessageId?: number) => void;
	createGroup: (groupName: string, userIds: number[]) => void;
	deleteGroup: (groupId: number) => void;

	// Group Management Actions
	addUserToGroup: (groupId: number, userId: number) => void;
	removeUserFromGroup: (groupId: number, userId: number) => void;

	// Friends Actions
	handleAddFriend: (userId: number) => void;
	handleAcceptFriend: (userId: number) => void;
	handleRefuseFriend: (userId: number) => void;
	handleCancelFriend: (userId: number) => void;
	handleRemoveFriend: (userId: number) => void;
	handleBlockedFriend: (userId: number) => void;
	handleUnBlockedFriend: (userId: number) => void;
	getFriendshipStatus: (userId: number) => string;
	handleCancelInvite: (token: string, ws?: WebSocket) => void;

	// Navigation
	setNavigateFunction: (navigate: (url: string) => void) => void;
	setLocationFunction: (pathname: string) => void;
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
	const { t } = useSafeLanguage();
	const [groups, setGroups] = useState<Group[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [groupMessages, setGroupMessages] = useState<{ [groupId: number]: Message[] }>({});
	const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [searchResults, setSearchResults] = useState<Friend[]>([]);
	const [inputSearch, setInputSearch] = useState("");
	const navigateRef = useRef<((url: string) => void) | null>(null);
	const [currentPathname, setCurrentPathname] = useState<string>("/login");

	// Refs pour éviter les re-renders constants
	const friendsRef = useRef<Friend[]>(friends);
	const currentUserIdRef = useRef<number | null>(currentUserId);
	const socketRef = useRef<WebSocket | null>(null);

	// Mettre à jour les refs quand les states changent
	useEffect(() => {
		friendsRef.current = friends;
	}, [friends]);

	useEffect(() => {
		currentUserIdRef.current = currentUserId;
	}, [currentUserId]);

	// --- Authentification ---

	// Pages où on ne veut pas ouvrir la socket du chat
	const authPages = useMemo(() => ["/login", "/register", "/forget-password", "/auth/checkCode"], []);
	const shouldConnectWebSocket = useMemo(() => !authPages.includes(currentPathname), [currentPathname, authPages]);

	const setNavigateFunction = useCallback((navigate: (url: string) => void) => {
		navigateRef.current = navigate;
	}, []);

	const setLocationFunction = useCallback((pathname: string) => {
		setCurrentPathname(pathname);
	}, []);

	const setInputSearchCallback = useCallback((value: string) => {
		setInputSearch(value);
	}, []);

	// Pour la recherche avec debounce
	const searchTimeout = useRef<NodeJS.Timeout | null>(null);
	const searchInterval = useRef<NodeJS.Timeout | null>(null);

	// --- Gestion des messages WebSocket ---
	const handleWebSocketMessage = useCallback((data: any, messageSocket?: WebSocket) => {
		try {
			socketRef.current = messageSocket || socket || socketRef.current;
			switch (data.action) {
				case "new_message":
					if (data.group_id && data.result === "ok" && data.message) {
						setGroupMessages(prev => ({
							...prev,
							[data.group_id]: [...(prev[data.group_id] || []), data.message]
						}));
					}
					if (data.friends) {
						setFriends(prev => [...prev, data.friends]);
					}
					break;

				case "loadMoreMessage":
					if (data.messages && data.group_id) {
						const arr = Object.values(data.messages) as Message[];
						arr.sort((a, b) => a.id - b.id);

						for (const key in arr) {
							const sender_id = arr[key].sender_id as number;
							const username = friendsRef.current.find(f => f.id === sender_id)?.username;
							(arr[key] as Message).sender_username = username || (sender_id === currentUserIdRef.current ? t('chat.me') : `${t('chat.user')} ${sender_id}`);
						}

						setGroupMessages(prev => ({
							...prev,
							[data.group_id]: [...arr, ...(prev[data.group_id] || [])]
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

					setCurrentUserId(data.user.id);

					const groupFriends: Friend[] = Object.values(data.friends || {});
					if (groupFriends.length > 0) {
						setFriends(sortFriends(groupFriends));
					}
					break;
				}

				case "create_group": {
					if (data.result === "ok" && data.group) {
						setGroups(prev => [...prev, data.group]);
					}
					break;
				}

				case "leave_group": {
					if (data.group_id) {
						// If user_id is provided and it's not the current user, remove that user from the group
						if (data.user_id && data.user_id !== currentUserIdRef.current) {
							setGroups(prev => prev.map(group => 
								group.id === data.group_id 
									? { 
										...group, 
										members: group.members.filter(member => member.id !== data.user_id),
										onlines_id: group.onlines_id.filter(id => id !== data.user_id)
									}
									: group
							));
						} else {
							// Current user left or was removed from the group, remove the entire group
							setGroups(prev => prev.filter(g => g.id !== data.group_id));
							setGroupMessages(prev => {
								const newMessages = { ...prev };
								delete newMessages[data.group_id];
								return newMessages;
							});
						}
					}
					break;
				}

				case "add_user_group":
					if (data.result === "ok" && data.group_id && data.user) {
						// Add the user to the group's members list
						setGroups(prev => prev.map(group => 
							group.id === data.group_id 
								? { ...group, members: [...group.members, data.user] }
								: group
						));
					}
					break;

				// --- Actions amis ---
				case "search_user":
					if (data.result === "ok" && Array.isArray(data.users)) {
						setSearchResults(sortFriends(data.users));
					} else {
						setSearchResults([]);
					}
					break;

				case "add_friend":
					if (data.result === "ok" && data.user) {
						const updateUserStatus = (user: Friend) => ({
							...user,
							relation: { ...user.relation, status: "pending" as const, target: data.targetId },
						});

						const existingFriend = friendsRef.current.find(f => f.id === data.user.id);

						if (!existingFriend) {
							const newFriend: Friend = {
								...data.user,
								relation: {
									status: "pending",
									target: data.targetId,
									privmsg_id: null
								},
								online: false
							};
							setFriends(prev => sortFriends([...prev, newFriend]));
						} else {
							setFriends(prev => sortFriends(prev.map(friend =>
								friend.id === data.user.id ? updateUserStatus(friend) : friend
							)));
						}

						const updateSearchResults = (user: Friend) => ({
							...user,
							relation: { ...user.relation, status: "pending" as const, target: data.targetId }
						});

						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user.id ? updateSearchResults(user) : user
								))
								: []
						);
					}
					break;

				case "accept_friend":
					if (data.result === "ok") {
						setFriends(prev => sortFriends(prev.map(friend =>
							friend.id === data.user_id
								? {
									...friend,
									relation: {
										...friend.relation,
										status: "friend",
										privmsg_id: data.group?.id || friend.relation.privmsg_id
									},
									online: data.isConnected
								}
								: friend
						)));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? {
											...user,
											relation: {
												...user.relation,
												status: "friend",
												privmsg_id: data.group?.id || user.relation.privmsg_id
											},
											online: data.isConnected
										}
										: user
								))
								: []
						);

						// Ajouter le groupe privé à la liste des groupes
						if (data.group) {
							setGroups(prev => {
								// Vérifier si le groupe n'existe pas déjà
								const groupExists = prev.some(g => g.id === data.group.id);
								if (!groupExists) {
									return [...prev, data.group];
								}
								return prev;
							});
						}
					}
					break;

				case "refuse_friend":
					if (data.result === "ok") {
						setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: '' } }
										: user
								))
								: []
						);
					}
					break;

				case "remove_friend":
					if (data.result === "ok") {
						setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
					}
					setSearchResults(prev =>
						prev
							? sortFriends(prev.map(user =>
								user.id === data.user_id
									? { ...user, relation: { ...user.relation, status: '' } }
									: user
							))
							: []
					);
					break;

				case "block_user":
					if (data.result === "ok") {
						setGroups(prev => prev.filter(group => group.id !== data.group_id));
						setFriends(prev => sortFriends(prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "blocked", online: false } }
								: friend
						)));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: "blocked", online: false } }
										: user
								))
								: []
						);

						if (data.targetId === currentUserIdRef.current) {
							setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
							setSearchResults(prev => prev ? prev.filter(user => user.id !== data.user_id) : []);
						}
					}
					break;

				case "unblock_user":
					if (data.result === "ok") {
						setFriends(prev => sortFriends(prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "" } }
								: friend
						)));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: "" } }
										: user
								))
								: []
						);
					}
					break;

				case "friend_connected":
					if (data.user_id) {
						setFriends(prev => sortFriends(prev.map(f =>
							f.id === data.user_id ? { ...f, online: true } : f
						)));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? { ...user, online: true }
										: user
								))
								: []
						);
						setGroups(prev => prev.map(group => {
							const isMember = group.members.some(member => member.id === data.user_id);
							const isOnline = group.onlines_id.includes(data.user_id);
							if (isMember && !isOnline) {
								return {
									...group,
									onlines_id: [...group.onlines_id, data.user_id]
								};
							}
							return group;
						}));
					}
					break;

				case "friend_disconnected":
					if (data.user_id) {
						setFriends(prev => sortFriends(prev.map(f =>
							f.id === data.user_id ? { ...f, online: false } : f
						)));
						setSearchResults(prev =>
							prev
								? sortFriends(prev.map(user =>
									user.id === data.user_id
										? { ...user, online: false }
										: user
								))
								: []
						);
						setGroups(prev => prev.map(group => {
							// Seulement mettre à jour si l'utilisateur est dans la liste onlines_id
							if (group.onlines_id && group.onlines_id.includes(data.user_id)) {
								return {
									...group,
									onlines_id: group.onlines_id.filter(id => id !== data.user_id)
								};
							}
							return group; // Retourner l'objet original sans modification
						}));
					}
					break;
				case "MultiInviteConfirm": {
					// Utiliser la socket qui nous a envoyé ce message - si on reçoit le message, c'est qu'elle fonctionne !
					const responseSocket = messageSocket || socket || socketRef.current;

					notification.confirm(data.txt)
						.then((result) => {
							if (!responseSocket) return console.error("No valid WebSocket available to confirm invite");
							if (result) {
								handleConfirmInvite(data.token, responseSocket);
								navigateRef.current?.(data.url);
							} else {
								handleRefuseInvite(data.token, responseSocket);
							}
						});
					break;
				}
				case "MultiInvitePending": {
					const responseSocket = messageSocket || socket || socketRef.current;

					notification.cancel(data.txt).then(() => {
						if (!responseSocket) return console.error("No valid WebSocket available to confirm invite");
						handleCancelInvite(data.token, responseSocket);
					});

					break;
				}
				case "MultiInviteRedirect":
					if (navigateRef.current) {
						if (window.location.pathname !== data.url) {
							notification.dismissAll();
							navigateRef.current(data.url);
						}
					}
					break;
				case "MultiInviteRefuse":
				case "MultiInviteCancel":
					notification.dismissAll();
					notification.info(data.txt);
					break;
				case "pong":
					// WebSocket pong response - connection is healthy
					break;
				default:
					break;
			}
		} catch (error) {
		}
	}, []);

	// --- Configuration WebSocket ---
	const socket = useSafeWebSocket({
		endpoint: shouldConnectWebSocket ? '/chat' : null,
		onMessage: handleWebSocketMessage,
		onStatusChange: setWsStatus,
		pingInterval: 30000,
	});

	useEffect(() => {
		socketRef.current = socket;
	}, [socket]);

	
	useEffect(() => {
		if (!shouldConnectWebSocket && socket) {
			socket.close();
			socketRef.current = null; // Mettre à jour la ref quand on ferme la socket
			setGroups([]);
			setFriends([]);
			setGroupMessages({});
			setSearchResults([]);
			setInputSearch("");
		}
	}, [shouldConnectWebSocket, socket]);

	useEffect(() => {
		if (searchTimeout.current) clearTimeout(searchTimeout.current);
		if (searchInterval.current) clearInterval(searchInterval.current);

		// Si l'input est vide, arrêter toute recherche
		if (!inputSearch.trim()) {
			setSearchResults([]);
			return;
		}
		const performSearch = () => {
			if (socketRef.current?.readyState !== WebSocket.OPEN) return;
			socketRef.current.send(JSON.stringify({
				action: "search_user",
				name: inputSearch,
				group_id: null,
			}));
		};
		searchTimeout.current = setTimeout(() => {
			performSearch();
			searchInterval.current = setInterval(() => {
				if (!inputSearch.trim()) {
					if (searchInterval.current) clearInterval(searchInterval.current);
					return;
				}
				performSearch();
			}, 500);
		}, 10);

		return () => {
			if (searchTimeout.current) clearTimeout(searchTimeout.current);
			if (searchInterval.current) clearInterval(searchInterval.current);
		};
	}, [inputSearch]); // Supprimer socket des dépendances car on utilise socketRef

	// --- Actions Chat ---
	const sendMessage = useCallback((groupId: number, message: string) => {
		if (!message.trim() || socketRef.current?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot send message: invalid message or WebSocket not ready");
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "new_message",
			group_id: groupId,
			message: message,
		}));
	}, []);

	const loadMessages = useCallback((groupId: number, firstMessageId: number = 0) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot load messages: WebSocket not ready");
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "loadMoreMessage",
			group_id: groupId,
			firstMessageId: firstMessageId,
		}));
	}, []);

	const createGroup = useCallback((groupName: string, userIds: number[]) => {
		if (!groupName.trim() || userIds.length === 0 || socketRef.current?.readyState !== WebSocket.OPEN) {
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "create_group",
			group_name: groupName.trim(),
			users_id: userIds,
		}));
	}, []); 

	const deleteGroup = useCallback((groupId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot delete group: WebSocket not ready");
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "delete_group",
			group_id: groupId,
		}));
	}, []);

	// --- Group Management Actions ---
	const addUserToGroup = useCallback((groupId: number, userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot add user to group: WebSocket not ready");
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "add_user_group",
			group_id: groupId,
			user_id: userId,
		}));
	}, []);

	const removeUserFromGroup = useCallback((groupId: number, userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) {
			console.warn("Cannot remove user from group: WebSocket not ready");
			return;
		}

		socketRef.current.send(JSON.stringify({
			action: "remove_user_group",
			group_id: groupId,
			user_id: userId,
		}));
	}, []);

	// --- Actions Amis ---
	const handleAddFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "add_friend",
			user_id: userId,
		}));
	}, []);

	const handleAcceptFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "accept_friend",
			user_id: userId,
		}));
	}, []);

	const handleRefuseFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "refuse_friend",
			user_id: userId,
		}));
	}, []);

	const handleCancelFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "cancel_request",
			user_id: userId,
		}));
	}, []);

	const handleRemoveFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "remove_friend",
			user_id: userId,
		}));
	}, []);

	const handleBlockedFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "block_user",
			user_id: userId,
		}));
	}, []);

	const handleUnBlockedFriend = useCallback((userId: number) => {
		if (socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({
			action: "unblock_user",
			user_id: userId,
		}));
	}, []);


	const handleConfirmInvite = useCallback((token: string, ws?: WebSocket) => {
		const targetSocket = ws || socketRef.current;
		if (targetSocket?.readyState !== WebSocket.OPEN) return;

		targetSocket.send(JSON.stringify({
			action: "MultiInviteConfirm",
			token: token,
		}));
	}, []);

	const handleRefuseInvite = useCallback((token: string, ws: WebSocket) => {

		ws.send(JSON.stringify({
			action: "MultiInviteRefuse",
			token: token,
		}));
	}, []);

	const handleCancelInvite = useCallback((token: string, ws?: WebSocket) => {
		const targetSocket = ws || socketRef.current;
		if (targetSocket?.readyState !== WebSocket.OPEN) return;

		targetSocket.send(JSON.stringify({
			action: "MultiInviteCancel",
			token: token,
		}));
	}, []);

	const getFriendshipStatus = useCallback((userId: number) => {
		const friend = friendsRef.current.find(f => f.id === userId);
		if (!friend) return "none";
		return friend.relation.status;
	}, []); // Utilise friendsRef donc pas de dépendance

	// --- Fonction de tri des amis (identique au backend) ---
	const sortFriends = useCallback((friends: Friend[]): Friend[] => {
		return [...friends].sort((a, b) => {
			// 1. Statut en ligne (priorité maximale)
			if (a.online && !b.online) return -1;
			if (!a.online && b.online) return 1;

			// 2. Statut "pending"
			if (a.relation.status === 'pending' && b.relation.status !== 'pending') return -1;
			if (a.relation.status !== 'pending' && b.relation.status === 'pending') return 1;

			// 3. Statut "blocked" (priorité minimale)
			if (a.relation.status === 'blocked' && b.relation.status !== 'blocked') return 1;
			if (a.relation.status !== 'blocked' && b.relation.status === 'blocked') return -1;

			return 0;
		});
	}, []);

	const contextValue: ChatWebSocketContextType = useMemo(() => ({
		wsStatus,
		socket,
		groups,
		friends,
		groupMessages,
		currentUserId,
		searchResults,
		inputSearch,
		setInputSearch: setInputSearchCallback,
		sendMessage,
		loadMessages,
		createGroup,
		deleteGroup,
		addUserToGroup,
		removeUserFromGroup,
		handleAddFriend,
		handleAcceptFriend,
		handleRefuseFriend,
		handleCancelFriend,
		handleRemoveFriend,
		handleBlockedFriend,
		handleUnBlockedFriend,
		getFriendshipStatus,
		setNavigateFunction,
		setLocationFunction,
		handleCancelInvite
	}), [
		wsStatus,
		socket,
		groups,
		friends,
		groupMessages,
		currentUserId,
		searchResults,
		inputSearch,
		setInputSearchCallback,
		sendMessage,
		loadMessages,
		createGroup,
		deleteGroup,
		addUserToGroup,
		removeUserFromGroup,
		handleAddFriend,
		handleAcceptFriend,
		handleRefuseFriend,
		handleCancelFriend,
		handleRemoveFriend,
		handleBlockedFriend,
		handleUnBlockedFriend,
		getFriendshipStatus,
		setNavigateFunction,
		setLocationFunction,
		handleCancelInvite
	]);

	return (
		<ChatWebSocketContext.Provider value={contextValue}>
			{children}
		</ChatWebSocketContext.Provider>
	);
};