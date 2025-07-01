// src/contexts/ChatWebSocketContext.tsx

import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import useSafeWebSocket, { WebSocketStatus } from '../../api/useSafeWebSocket';
import { Group, Message, Friend, Member } from './types/chat';
import notification from '../components/Notifications'
import { useAuth } from '../../contexts/AuthContext';

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

	// Friends Actions
	handleAddFriend: (userId: number) => void;
	handleAcceptFriend: (userId: number) => void;
	handleRefuseFriend: (userId: number) => void;
	handleCancelFriend: (userId: number) => void;
	handleRemoveFriend: (userId: number) => void;
	handleBlockedFriend: (userId: number) => void;
	handleUnBlockedFriend: (userId: number) => void;
	getFriendshipStatus: (userId: number) => string;

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
	const handleWebSocketMessage = useCallback((data: any) => {
		try {
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
							const username = friendsRef.current.find(f => f.id === sender_id)?.username;
							console.log("Message mapping:", username, sender_id, arr[key].message);
							console.log("Available friends:", friendsRef.current);
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
					console.log("Groups initialized:", groupArray);

					setCurrentUserId(data.user.id);
					console.log(`Current user ID: ${data.user.id}`);

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
					if (data.result === "ok" && data.user) {
						const updateUserStatus = (user: Friend) => ({
							...user,
							relation: { ...user.relation, status: "pending" as const, target: data.targetId },
						});

						const existingFriend = friendsRef.current.find(f => f.id === data.user.id);
						console.log("Existing friend:", existingFriend, "Data user:", data.user);

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
							setFriends(prev => [...prev, newFriend]);
						} else {
							setFriends(prev => prev.map(friend =>
								friend.id === data.user.id ? updateUserStatus(friend) : friend
							));
						}

						const updateSearchResults = (user: Friend) => ({
							...user,
							relation: { ...user.relation, status: "pending" as const, target: data.targetId }
						});

						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user.id ? updateSearchResults(user) : user
								)
								: []
						);
					}
					break;

				case "accept_friend":
					if (data.result === "ok") {
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "friend" }, online: data.isConnected }
								: friend
						));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: "friend" } }
										: user
								)
								: []
						);
					}
					break;

				case "refuse_friend":
					console.log("receive refuse_friend", data);
					if (data.result === "ok") {
						setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: '' } }
										: user
								)
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
							? prev.map(user =>
								user.id === data.user_id
									? { ...user, relation: { ...user.relation, status: '' } }
									: user
							)
							: []
					);
					break;

				case "block_user":
					if (data.result === "ok") {
						setGroups(prev => prev.filter(group => group.id !== data.group_id));
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "blocked" } }
								: friend
						));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: "blocked" } }
										: user
								)
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
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "" } }
								: friend
						));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, relation: { ...user.relation, status: "" } }
										: user
								)
								: []
						);
					}
					break;

				case "friend_connected":
					if (data.user_id) {
						setFriends(prev => prev.map(f =>
							f.id === data.user_id ? { ...f, online: true } : f
						));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, online: true }
										: user
								)
								: []
						);
					}
					break;

				case "friend_disconnected":
					if (data.user_id) {
						setFriends(prev => prev.map(f =>
							f.id === data.user_id ? { ...f, online: false } : f
						));
						setSearchResults(prev =>
							prev
								? prev.map(user =>
									user.id === data.user_id
										? { ...user, online: false }
										: user
								)
								: []
						);
					}
					break;
				case "MultiInvite":
					notification.confirm(`${data.username} vous invite à jouer à Pong`)
						.then((result) => {
							if (result && navigateRef.current) {
								navigateRef.current(data.url);
							} else {
							}
						});
					break;
				default:
					console.log("Unhandled WebSocket action:", data.action);
					break;
			}
		} catch (error) {
			console.error("Error handling WebSocket message:", error);
		}
	}, []); // Pas de dépendances car on utilise les refs

	// --- Configuration WebSocket ---
	const socket = useSafeWebSocket({
		endpoint: shouldConnectWebSocket ? '/chat' : null,
		onMessage: handleWebSocketMessage,
		onStatusChange: setWsStatus,
		pingInterval: 30000,
	});

	useEffect(() => {
		if (!shouldConnectWebSocket && socket) {
			console.log("Closing WebSocket connection as it's not needed");
			socket.close();
			setGroups([]);
			setFriends([]);
			setGroupMessages({});
			setSearchResults([]);
			setInputSearch("");
		}
	}, [shouldConnectWebSocket, socket]);

	// --- Recherche d'ami (debounce + interval) ---
	useEffect(() => {
		// Nettoyer les timers existants
		if (searchTimeout.current) clearTimeout(searchTimeout.current);
		if (searchInterval.current) clearInterval(searchInterval.current);

		// Si l'input est vide, arrêter toute recherche
		if (!inputSearch.trim()) {
			setSearchResults([]);
			return;
		}

		// Fonction de recherche réutilisable
		const performSearch = () => {
			if (socket?.readyState !== WebSocket.OPEN) return;
			console.log("🔍 Searching for:", inputSearch);
			socket.send(JSON.stringify({
				action: "search_user",
				name: inputSearch,
				group_id: null,
			}));
		};

		// Debounce initial : attendre 500ms après la dernière modification
		searchTimeout.current = setTimeout(() => {
			// Première recherche après le debounce
			performSearch();

			// Démarrer l'interval pour répéter la recherche toutes les 100ms
			searchInterval.current = setInterval(() => {
				if (!inputSearch.trim()) {
					// Si l'input devient vide, arrêter l'interval
					if (searchInterval.current) clearInterval(searchInterval.current);
					return;
				}
				performSearch();
			}, 500);
		}, 10);

		// Cleanup function
		return () => {
			if (searchTimeout.current) clearTimeout(searchTimeout.current);
			if (searchInterval.current) clearInterval(searchInterval.current);
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
			return;
		}

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

	// --- Actions Amis ---
	const handleAddFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		console.log("add_friend", userId);
		socket.send(JSON.stringify({
			action: "add_friend",
			user_id: userId,
		}));
	}, [socket]);

	const handleAcceptFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({
			action: "accept_friend",
			user_id: userId,
		}));
	}, [socket]);

	const handleRefuseFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({
			action: "refuse_friend",
			user_id: userId,
		}));
	}, [socket]);

	const handleCancelFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({
			action: "cancel_request",
			user_id: userId,
		}));
	}, [socket]);

	const handleRemoveFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({
			action: "remove_friend",
			user_id: userId,
		}));
	}, [socket]);

	const handleBlockedFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		console.log("block_user", userId);
		socket.send(JSON.stringify({
			action: "block_user",
			user_id: userId,
		}));
	}, [socket]);

	const handleUnBlockedFriend = useCallback((userId: number) => {
		if (socket?.readyState !== WebSocket.OPEN) return;
		console.log("unblock_user", userId);
		socket.send(JSON.stringify({
			action: "unblock_user",
			user_id: userId,
		}));
	}, [socket]);

	const getFriendshipStatus = useCallback((userId: number) => {
		const friend = friendsRef.current.find(f => f.id === userId);
		if (!friend) return "none";
		return friend.relation.status;
	}, []); // Utilise friendsRef donc pas de dépendance

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
		handleAddFriend,
		handleAcceptFriend,
		handleRefuseFriend,
		handleCancelFriend,
		handleRemoveFriend,
		handleBlockedFriend,
		handleUnBlockedFriend,
		getFriendshipStatus,
		setNavigateFunction,
		setLocationFunction
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
		handleAddFriend,
		handleAcceptFriend,
		handleRefuseFriend,
		handleCancelFriend,
		handleRemoveFriend,
		handleBlockedFriend,
		handleUnBlockedFriend,
		getFriendshipStatus,
		setNavigateFunction,
		setLocationFunction
	]);

	return (
		<ChatWebSocketContext.Provider value={contextValue}>
			{children}
		</ChatWebSocketContext.Provider>
	);
};