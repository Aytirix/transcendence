import React, { useEffect, useRef, useState } from "react";
import useSafeWebSocket, { WebSocketStatus } from "../api/useSafeWebSocket";

// Types
type Member = { id: number; username: string; avatar?: string; lang?: string };
type Group = {
  id: number;
  name: string | null;
  members: Member[];
  owners_id: number[];
  onlines_id: number[];
  private: number;
};
type Message = {
  id: number;
  sender_id: number;
  message: string;
  sent_at: string;
};
type Friend = {
  id: number;
  username: string;
  avatar?: string;
  lang?: string;
  relation: {
    status: "pending" | "friend";
    target: number;
    privmsg_id?: number | null;
  };
  online: boolean;
};

const endpoint = `/chat`;

const ChatPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFriends, setShowFriends] = useState(false);

  const [groupMessages, setGroupMessages] = useState<{ [groupId: number]: Message[] }>({});
  const [input, setInput] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Member[] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null); // message d'action

  // États pour la création de groupe
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<number[]>([]);

  const selectedMessages: Message[] = selectedGroup ? groupMessages[selectedGroup.id] || [] : [];

  // Fonction pour vérifier le statut d'un utilisateur avec l'utilisateur actuel
  const getFriendshipStatus = (userId: number) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "none"; // Pas d'ami
    return friend.relation.status; // "pending" ou "friend"
  };

  const socket = useSafeWebSocket({
    endpoint,
    onMessage: (data) => {
      if (!data.action) {
        console.log("erreur WS reçu :", data);
        return;
      }
      if (data.action !== "pong" && data.action !== "search_user")
        console.log("Message WS reçu :", data);

      switch (data.action) {
        case "new_message":
          if (data.group_id && data.result === "ok" && data.message) {
            setGroupMessages(prev => ({
              ...prev,
              [data.group_id]: [...(prev[data.group_id] || []), data.message]
            }));
          }
          break;
        case "loadMoreMessage":
          if (data.messages && typeof data.messages === "object" && data.group_id) {
            const arr = Object.values(data.messages) as Message[];
            arr.sort((a, b) => a.id - b.id);
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
        case "pong":
          break;
        case "init_connected": {
          const groupArray: Group[] = Object.values(data.groups);
          setGroups(groupArray);
          if (groupArray.length) setSelectedGroup(groupArray[0]);
          if (data.user?.id) setCurrentUserId(data.user.id);
          if (data.friends) setFriends(data.friends);
          break;
        }
        case "search_user": {
          if (data.result === "ok" && Array.isArray(data.users)) {
            setSearchResults(data.users);
          } else {
            setSearchResults([]);
          }
          break;
        }
        case "invite_user": {
          if (data.result === "ok") setFeedback("Invitation envoyée !");
          else setFeedback("Erreur lors de l'invitation.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        case "add_friend": {
          if (data.result === "ok") {
            setFeedback("Demande d'amitié envoyée !");
            // Optionnel : ajouter l'ami en attente dans la liste locale
            if (data.user) {
              const newFriend: Friend = {
                ...data.user,
                relation: {
                  status: "pending",
                  target: data.user.id,
                  privmsg_id: null
                },
                online: false // On ne connaît pas son statut en ligne
              };
              setFriends(prev => [...prev, newFriend]);
            }
          } else setFeedback("Erreur lors de l'envoi de la demande.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        case "create_private_group": {
          if (data.result === "ok" && data.group) {
            setGroups(prev => [...prev, data.group]);
            setFeedback("Groupe privé créé !");
            setSelectedGroup(data.group);
          } else setFeedback("Erreur création du groupe privé.");
          setTimeout(() => setFeedback(null), 2000);
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
          } else setFeedback("Erreur lors de la création du groupe.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        case "accept_friend": {
          if (data.result === "ok") {
            setFeedback("Ami accepté !");
            // Mettre à jour la liste des amis localement
            setFriends(prev => prev.map(friend => 
              friend.id === data.user_id 
                ? { ...friend, relation: { ...friend.relation, status: "friend" } }
                : friend
            ));
          } else setFeedback("Erreur lors de l'acceptation.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        case "refuse_friend": {
          if (data.result === "ok") {
            setFeedback("Invitation refusée !");
            // Retirer l'ami de la liste
            setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
          } else setFeedback("Erreur lors du refus.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        case "remove_friend": {
          if (data.result === "ok") {
            setFeedback("Ami supprimé !");
            // Retirer l'ami de la liste
            setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
          } else setFeedback("Erreur lors de la suppression.");
          setTimeout(() => setFeedback(null), 2000);
          break;
        }
        default:
          console.log("Message WS reçu error :", data);
      }
    },
    onStatusChange: setWsStatus,
    reconnectDelay: 1000,
    maxReconnectAttempts: 15,
    pingInterval: 30000,
  });

  useEffect(() => {
    if (!socket || !selectedGroup || showFriends) return;
    socket.send(
      JSON.stringify({
        action: "loadMoreMessage",
        group_id: selectedGroup.id,
        firstMessageId: 0,
      })
    );
    setSearchResults(null); // Reset recherche si on change de groupe
  }, [selectedGroup, socket, showFriends]);

  const sendMessage = () => {
    if (!input.trim() || !selectedGroup || !socket || wsStatus !== "Connected") return;
    const payload = {
      action: "new_message",
      group_id: selectedGroup.id,
      message: input,
    };
    socket.send(JSON.stringify(payload));
    setInput("");
  };

  // ----- SEARCH LIVE AVEC DEBOUNCE -----
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!inputSearch.trim()) {
      setSearchResults(null);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    // 500ms
    searchTimeout.current = setTimeout(() => {
      if (!socket || wsStatus !== "Connected") return;
      setSearchResults(null);
      socket.send(JSON.stringify({
        action: "search_user",
        name: inputSearch,
        group_id: null,
      }));
    }, 500);
    // Nettoyage du timer
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line
  }, [inputSearch]);

  // ----- ACTIONS -----
  const handleInvite = (userId: number) => {
    if (!selectedGroup || !socket || wsStatus !== "Connected") return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "add_friend",
      user_id: userId,
      group_id: selectedGroup.id,
    }));
  };

  const handleAddFriend = (userId: number) => {
    if (!socket || wsStatus !== "Connected") return;
    setFeedback(null);
    console.log("add_friend userID", userId);
    socket.send(JSON.stringify({
      action: "add_friend",
      user_id: userId,
    }));
  };

  const handleAcceptFriend = (userId: number) => {
    if (!socket || wsStatus !== "Connected") return;
    setFeedback(null);
    console.log(" accept_friend userID", userId);
    console.log(JSON.stringify({
      action: "accept_friend",
      user_id: userId,
    }));
    socket.send(JSON.stringify({
      action: "accept_friend",
      user_id: userId,
    }));
  };

  const handleRefuseFriend = (userId: number) => {
    if (!socket || wsStatus !== "Connected") return;
    setFeedback(null);
    console.log(JSON.stringify({
      action: "refuse_friend",
      user_id: userId,
    }));
    socket.send(JSON.stringify({
      action: "refuse_friend",
      user_id: userId,
    }));
  };

  const handleRemoveFriend = (userId: number) => {
    if (!socket || wsStatus !== "Connected") return;
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "remove_friend",
      user_id: userId,
    }));
  };

  // Fonction pour gérer la création de groupe
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedFriendsForGroup.length === 0 || !socket || wsStatus !== "Connected") {
      setFeedback("Veuillez saisir un nom de groupe et sélectionner au moins un ami.");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    
    setFeedback(null);
    socket.send(JSON.stringify({
      action: "create_group",
      group_name: newGroupName,
      users_id: selectedFriendsForGroup,
    }));
  };

  // Fonction pour gérer la sélection des amis pour le groupe
  const toggleFriendSelection = (friendId: number) => {
    setSelectedFriendsForGroup(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  // Filtrer les amis qui sont vraiment des amis (pas en attente)
  const confirmedFriends = friends.filter(friend => friend.relation.status === "friend");

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-100 border-r flex flex-col">
        <label
          htmlFor="search"
          className="flex items-center border bg-gray-200 p-2 m-4 rounded"
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            type="search"
            className="grow"
            placeholder="Rechercher un user"
            value={inputSearch}
            onChange={e => setInputSearch(e.target.value)}
          />
        </label>
        
        <div className="p-4 font-bold text-xl">Groupes</div>
        
        {/* Section de création de groupe */}
        <div className="px-4 pb-2">
          <button
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            onClick={() => setShowCreateGroup(!showCreateGroup)}
          >
            {showCreateGroup ? "Annuler" : "Créer un groupe"}
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
              <div className="max-h-32 overflow-y-auto space-y-1">
                {confirmedFriends.length === 0 ? (
                  <div className="text-xs text-gray-500">Aucun ami disponible</div>
                ) : (
                  confirmedFriends.map(friend => (
                    <label key={friend.id} className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFriendsForGroup.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                      />
                      <span>{friend.username}</span>
                    </label>
                  ))
                )}
              </div>
              
              <button
                className="w-full p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedFriendsForGroup.length === 0}
              >
                Créer
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-auto">
          {groups.map((g) => (
            <button
              key={g.id}
              className={`w-full text-left p-4 hover:bg-blue-200 focus:bg-blue-300 ${selectedGroup?.id === g.id && !showFriends ? "bg-blue-200 font-bold" : ""}`}
              onClick={() => {
                setSelectedGroup(g);
                setShowFriends(false);
              }}
            >
              {g.name || g.members.map(m => m.username).join(', ')}
            </button>
          ))}
        </div>
        <button
          className={`mx-4 mb-2 p-2 text-white rounded ${showFriends ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}`}
          onClick={() => setShowFriends(!showFriends)}
        >
          {showFriends ? "Retour aux groupes" : "Afficher les amis"}
        </button>

        <div className="text-xs text-gray-700 p-2">
          Statut du chat:{" "}
          <span
            className={
              wsStatus === "Connected"
                ? "text-green-600"
                : wsStatus === "Error"
                ? "text-red-500"
                : "text-yellow-600"
            }
          >
            {wsStatus}
          </span>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b font-semibold text-lg">
          {showFriends ? (
            `Liste des amis (${friends.length})`
          ) : (
            selectedGroup
              ? `Discussion de groupe : ${selectedGroup.name || selectedGroup.members.map(m => m.username).join(', ')}`
              : "Sélectionne un groupe..."
          )}
        </header>
        {/* FEEDBACK */}
        {feedback && (
          <div className="m-4 p-2 bg-green-200 rounded text-green-900 text-center">{feedback}</div>
        )}
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
          {showFriends ? (
            // AFFICHAGE DE LA LISTE DES AMIS AU CENTRE
            friends.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                Aucun ami pour le moment
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 bg-white rounded shadow flex items-center space-x-3"
                >
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.username} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold">
                      {friend.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{friend.username}</div>
                    <div className="text-sm text-gray-500">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${friend.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                      {friend.online ? "En ligne" : "Hors ligne"} • Langue: {friend.lang ?? "?"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Statut: {friend.relation.status === "pending" ? "En attente" : "Ami"}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {friend.relation.status === "pending" ? (
                      <>
                        <button
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                          onClick={() => handleAcceptFriend(friend.id)}
                        >
                          Accepter
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                          onClick={() => handleRefuseFriend(friend.id)}
                        >
                          Refuser
                        </button>
                      </>
                    ) : (
                      <button
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            searchResults
              ? (
                searchResults.length === 0
                  ? <div className="text-center text-gray-500 mt-8">Aucun utilisateur trouvé.</div>
                  : searchResults.map(user => {
                      const friendshipStatus = getFriendshipStatus(user.id);
                      const isCurrentUser = user.id === currentUserId;
                      
                      return (
                        <div
                          key={user.id}
                          className="p-2 bg-white rounded shadow flex items-center space-x-2"
                        >
                          {user.avatar
                            ? (<img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />)
                            : (<div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">{user.username[0]?.toUpperCase()}</div>)
                          }
                          <div className="flex-1">
                            <div className="font-semibold">
                              {user.username}
                              {isCurrentUser && <span className="text-xs text-gray-500 ml-2">(Vous)</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              Langue : {user.lang ?? "?"}
                              {friendshipStatus !== "none" && (
                                <span className="ml-2">
                                  • {friendshipStatus === "pending" ? "Demande en attente" : "Déjà ami"}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* BOUTONS ACTIONS */}
                          <div className="flex space-x-2">
                            {!isCurrentUser && friendshipStatus && (
                              <button
                                className="text-sm px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                                onClick={() => handleInvite(user.id)}
                              >
                                Inviter
                              </button>
                            )}
                            {!isCurrentUser && friendshipStatus === "none" && (
                              <button
                                className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                onClick={() => handleAddFriend(user.id)}
                              >
                                Demande d'ami
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
              )
              : (
                selectedMessages.map((m, idx) => (
                  <div
                    key={m.id ?? idx}
                    className={`max-w-xl ${
                      m.sender_id === currentUserId
                        ? "ml-auto bg-blue-200"
                        : "mr-auto bg-white"
                    } p-2 rounded shadow`}
                  >
                    <div>{m.sender_id}: {m.message}</div>
                    <div className="text-xs text-gray-500 text-right">
                      {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""}
                    </div>
                  </div>
                ))
              )
          )}
        </div>
        {selectedGroup && !searchResults && !showFriends && (
          <footer className="p-4 border-t flex space-x-2">
            <input
              type="text"
              className="flex-1 border rounded p-2"
              placeholder="Tape un message…"
              value={input}
              disabled={wsStatus !== "Connected"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={sendMessage}
              disabled={wsStatus !== "Connected"}
            >
              Envoyer
            </button>
          </footer>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
