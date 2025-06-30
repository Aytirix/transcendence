// src/contexts/ChatWebSocketContext.tsx

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import useSafeWebSocket, { WebSocketStatus } from '../../api/useSafeWebSocket';
import { Group, Message, Friend, Member } from './types/chat';

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
	searchResults: Friend[] | null;
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
	const [searchResults, setSearchResults] = useState<Friend[] | null>(null);
	const [inputSearch, setInputSearch] = useState("");

	// Pour la recherche avec debounce
	const searchTimeout = useRef<NodeJS.Timeout | null>(null);

	// --- Gestion des messages WebSocket ---
	const handleWebSocketMessage = useCallback((data: any) => {
		try {
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

					if (data.user?.id) setCurrentUserId(data.user.id);

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
					if (data.result === "ok") {
						if (data.user) {
							if (!friends.some(f => f.id === data.user.id)) {
								console.log("Adding new friend to the list:", data.user);
								const newFriend: Friend = {
									...data.user,
									relation: {
										status: "pending",
										target: data.user.id,
										privmsg_id: null
									},
									online: false
								};
								setFriends(prev => [...prev, newFriend]);
								setSearchResults(prev =>
									prev
										? prev.map(user =>
											user.id === data.user.id
												? { ...user, relation: { ...user.relation, status: "pending" } }
												: user
										)
										: null
								);
							} else {
								console.log("Friend already exists in the list, updating status");
								setFriends(prev => prev.map(friend =>
									friend.id === data.user.id
										? { ...friend, relation: { ...friend.relation, status: "pending" } }
										: friend
								));
								setSearchResults(prev =>
									prev
										? prev.map(user =>
											user.id === data.user.id
												? { ...user, relation: { ...user.relation, status: "pending" } }
												: user
										)
										: null
								);
							}
						}
					}
					break;

				case "accept_friend":
					if (data.result === "ok") {
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "friend" } }
								: friend
						));
					} else {
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
								: null
						);
					}
					break;

				case "remove_friend":
					if (data.result === "ok") {
						setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
					}
					break;

				case "block_user":
					if (data.result === "ok") {
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "blocked" } }
								: friend
						));
					}
					break;

				case "unblock_user":
					if (data.result === "ok") {
						setFriends(prev => prev.map(friend =>
							friend.id === data.user_id
								? { ...friend, relation: { ...friend.relation, status: "friend" } }
								: friend
						));
					}
					break;

				case "friend_connected":
					if (data.user_id) {
						setFriends(prev => prev.map(f =>
							f.id === data.user_id ? { ...f, online: true } : f
						));
					}
					break;

				case "friend_disconnected":
					if (data.user_id) {
						setFriends(prev => prev.map(f =>
							f.id === data.user_id ? { ...f, online: false } : f
						));
					}
					break;

				default:
					console.log("Unhandled WebSocket action:", data.action);
					break;
			}
		} catch (error) {
			console.error("Error handling WebSocket message:", error);
		}
	}, [friends]);

	// --- Configuration WebSocket ---
	const socket = useSafeWebSocket({
		endpoint: '/chat',
		onMessage: handleWebSocketMessage,
		onStatusChange: setWsStatus,
		pingInterval: 30000,
	});

	// --- Recherche d'ami (debounce) ---
	useEffect(() => {
		if (!inputSearch.trim()) {
			setSearchResults(null);
			if (searchTimeout.current) clearTimeout(searchTimeout.current);
			return;
		}

		if (searchTimeout.current) clearTimeout(searchTimeout.current);

		searchTimeout.current = setTimeout(() => {
			if (socket?.readyState !== WebSocket.OPEN) return;
			setSearchResults(null);
			socket.send(JSON.stringify({
				action: "search_user",
				name: inputSearch,
				group_id: null,
			}));
		}, 500);

		return () => {
			if (searchTimeout.current) clearTimeout(searchTimeout.current);
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
		const friend = friends.find(f => f.id === userId);
		if (!friend) return "none";
		return friend.relation.status;
	}, [friends]);

	const contextValue: ChatWebSocketContextType = {
		wsStatus,
		socket,
		groups,
		friends,
		groupMessages,
		currentUserId,
		searchResults,
		inputSearch,
		setInputSearch,
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
	};

	return (
		<ChatWebSocketContext.Provider value={contextValue}>
			{children}
		</ChatWebSocketContext.Provider>
	);
};