// src/ChatPage.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import useSafeWebSocket, { WebSocketStatus } from "../../api/useSafeWebSocket"; // Assurez-vous que le chemin est correct

// Import des types et des nouveaux composants
import { Member, Group, Message, Friend } from "./types/chat"; // Assurez-vous que le chemin est correct
import ChatSidebar from "./components/ChatSidebar"; // Assurez-vous que le chemin est correct
import ChatContentArea from "./components/ChatContentArea"; // Assurez-vous que le chemin est correct

const endpoint = `/chat`; // Assurez-vous que l'endpoint est correct

const ChatPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFriends, setShowFriends] = useState(false); // Pour afficher la liste d'amis ou les groupes

  const [groupMessages, setGroupMessages] = useState<{ [groupId: number]: Message[] }>({});
  const [input, setInput] = useState(""); // Input pour les messages
  const [inputSearch, setInputSearch] = useState(""); // Input pour la recherche d'utilisateurs
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Member[] | null>(null); // Résultats de la recherche d'utilisateurs
  const [feedback, setFeedback] = useState<string | null>(null); // Message de feedback utilisateur

  // États pour la création de groupe
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<number[]>([]);

  // Messages du groupe actuellement sélectionné
  const selectedMessages: Message[] = selectedGroup ? groupMessages[selectedGroup.id] || [] : [];

  // Fonction pour vérifier le statut d'un utilisateur avec l'utilisateur actuel
  const getFriendshipStatus = useCallback((userId: number) => {
    const friend = friends.find(f => f.id === userId);
    if (!friend) return "none"; // Pas d'ami
    return friend.relation.status; // "pending" ou "friend"
  }, [friends]);

  // --- Gestion des messages WebSocket ---
  const handleWebSocketMessage = useCallback((data: any) => {
    if (!data.action) {
      console.log("Erreur: Message WS reçu sans action :", data);
      return;
    }
      console.log("Message WS reçu :", data);
    switch (data.action) {
      case "new_message":
        if (data.group_id && data.result === "ok" && data.message) {
          // Ajouter le nouveau message au bon groupe
          setGroupMessages(prev => ({
            ...prev,
            [data.group_id]: [...(prev[data.group_id] || []), data.message]
          }));
        }
        break;
      case "loadMoreMessage":
        if (data.messages && data.group_id) {
          // Les messages chargés sont généralement dans un objet, convertir en tableau et trier par ID
          const arr = Object.values(data.messages) as Message[];
          arr.sort((a, b) => a.id - b.id);
          // Remplacer ou fusionner les messages existants (ici, on remplace pour la démo simple)
          setGroupMessages(prev => ({
            ...prev,
            [data.group_id]: arr
          }));
        } else if (data.group_id) {
           // Aucun message chargé pour ce groupe
          setGroupMessages(prev => ({
            ...prev,
            [data.group_id]: []
          }));
        }
        break;
      case "pong":
        // Réponse au ping, pas d'action visible nécessaire
        break;
      case "init_connected": {
        // Initialisation après connexion réussie
        const groupArray: Group[] = Object.values(data.groups || {}); // Gérer le cas où 'groups' est null
        setGroups(groupArray);
        // Sélectionner le premier groupe par défaut s'il y en a
        if (groupArray.length > 0) setSelectedGroup(groupArray[0]);
        // Définir l'ID de l'utilisateur actuel
        if (data.user?.id) setCurrentUserId(data.user.id);
        // Définir la liste des amis
        if (data.friends) setFriends(data.friends);
        break;
      }
      case "search_user": {
        // Résultats de la recherche d'utilisateur
        if (data.result === "ok" && Array.isArray(data.users)) {
          setSearchResults(data.users);
        } else {
          setSearchResults([]); // Aucun résultat
        }
        break;
      }
      case "invite_user": { // Typiquement pour inviter dans un groupe
        if (data.result === "ok") setFeedback("Invitation envoyée !");
        else setFeedback("Erreur lors de l'invitation.");
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "add_friend": { // Quand on envoie/reçoit une demande d'ami
        if (data.result === "ok") {
          setFeedback("Demande d'amitié envoyée !");
          // Optionnel : ajouter l'ami en attente dans la liste locale
          if (data.user) { // Le serveur renvoie potentiellement l'utilisateur invité
             // Vérifier s'il n'est pas déjà dans la liste (ex: si on reçoit la demande)
             if (!friends.some(f => f.id === data.user.id)) {
                const newFriend: Friend = {
                  ...data.user, // data.user contient id, username, avatar, lang
                  relation: {
                    status: "pending",
                    target: data.user.id, // target est l'id de l'utilisateur à qui on envoie la demande, ici c'est l'utilisateur renvoyé par le serveur
                    privmsg_id: null
                  },
                  online: false // On ne connaît pas son statut en ligne immédiatement
                };
                setFriends(prev => [...prev, newFriend]);
             }
          }
        } else {
             setFeedback(data.error || "Erreur lors de l'envoi de la demande.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "create_group": {
        if (data.result === "ok" && data.group) {
          setGroups(prev => [...prev, data.group]);
          setFeedback("Groupe créé avec succès !");
          setSelectedGroup(data.group); // Sélectionner le nouveau groupe
          setShowCreateGroup(false); // Fermer le formulaire
          setNewGroupName(""); // Réinitialiser le nom
          setSelectedFriendsForGroup([]); // Réinitialiser les amis sélectionnés
        } else {
           setFeedback(data.error || "Erreur lors de la création du groupe.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "accept_friend": {
        if (data.result === "ok") {
          setFeedback("Ami accepté !");
          // Mettre à jour la liste des amis localement: changer le statut en "friend"
          setFriends(prev => prev.map(friend =>
            friend.id === data.user_id
              ? { ...friend, relation: { ...friend.relation, status: "friend" } }
              : friend
          ));
        } else {
           setFeedback(data.error || "Erreur lors de l'acceptation.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "refuse_friend": {
        if (data.result === "ok") {
          setFeedback("Invitation refusée !");
          // Retirer l'ami de la liste si la demande était entrante ou sortante
          setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
        } else {
          setFeedback(data.error || "Erreur lors du refus.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "remove_friend": {
        if (data.result === "ok") {
          setFeedback("Ami supprimé !");
          // Retirer l'ami de la liste
          setFriends(prev => prev.filter(friend => friend.id !== data.user_id));
          // Si le groupe privé correspondant était sélectionné, le désélectionner
          // TODO: Ajouter la logique pour trouver le groupe privé par privmsg_id et le désélectionner
        } else {
          setFeedback(data.error || "Erreur lors de la suppression.");
        }
        setTimeout(() => setFeedback(null), 2000);
        break;
      }
      case "user_online": {
          if (data.user_id) {
              setFriends(prev => prev.map(f => f.id === data.user_id ? { ...f, online: true } : f));
              // Optionnel: Mettre à jour les membres des groupes si nécessaire
              // setGroups(...)
          }
          break;
      }
      case "user_offline": {
           if (data.user_id) {
              setFriends(prev => prev.map(f => f.id === data.user_id ? { ...f, online: false } : f));
               // Optionnel: Mettre à jour les membres des groupes si nécessaire
              // setGroups(...)
          }
          break;
      }
      case "group_updated": {
           if (data.group) {
               setGroups(prev => prev.map(g => g.id === data.group.id ? data.group : g));
               // Mettre à jour le groupe sélectionné s'il s'agit du même
               if (selectedGroup?.id === data.group.id) {
                   setSelectedGroup(data.group);
               }
           }
           break;
      }
       case "group_deleted": {
           if (data.group_id) {
               setGroups(prev => prev.filter(g => g.id !== data.group_id));
               // Désélectionner le groupe s'il était sélectionné
               if (selectedGroup?.id === data.group_id) {
                   setSelectedGroup(null);
               }
           }
           break;
       }


      default:
        console.log("Action WS inconnue reçue :", data);
    }
  }, [friends, selectedGroup]); // Dépendances pour useCallback

  // --- Configuration WebSocket ---
  const socket = useSafeWebSocket({
    endpoint,
    onMessage: handleWebSocketMessage, // Utiliser le handler externalisé
    onStatusChange: setWsStatus,
    reconnectDelay: 1000,
    maxReconnectAttempts: 15,
    pingInterval: 30000,
  });

  // --- Effet pour charger les messages quand un groupe est sélectionné ---
  useEffect(() => {
    // Charger les messages uniquement si connecté, un groupe est sélectionné et qu'on ne visualise PAS la liste d'amis
    if (socket?.readyState !== WebSocket.OPEN || !selectedGroup || showFriends) {
         // Réinitialiser les messages si on change de vue (amis/recherche)
         if (!selectedGroup || showFriends || searchResults) {
              setGroupMessages({});
         }
        return;
    }

    // Demander le chargement des messages du groupe sélectionné
    socket.send(
      JSON.stringify({
        action: "loadMoreMessage",
        group_id: selectedGroup.id,
        firstMessageId: 0, // Charger à partir du début
      })
    );
     // Réinitialiser les résultats de recherche quand on sélectionne un groupe
    setSearchResults(null);

  }, [selectedGroup, socket, showFriends, searchResults]); // Ajouter searchResults aux dépendances


  // --- Effet pour le debounce de la recherche utilisateur ---
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ne rien faire si la recherche est vide
    if (!inputSearch.trim()) {
      setSearchResults(null); // Effacer les anciens résultats
      if (searchTimeout.current) clearTimeout(searchTimeout.current); // Annuler le timer si existant
      return;
    }

    // Annuler le timer précédent si l'utilisateur tape à nouveau
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // Définir un nouveau timer pour envoyer la requête après 500ms d'inactivité
    searchTimeout.current = setTimeout(() => {
      if (socket?.readyState !== WebSocket.OPEN) {
         console.warn("WebSocket not open for search.");
         return;
      }
      setSearchResults(null); // Effacer les résultats précédents en attendant les nouveaux
      socket.send(JSON.stringify({
        action: "search_user",
        name: inputSearch,
        group_id: null, // Recherche globale d'utilisateur
      }));
    }, 500); // Délai de debounce (500ms)

    // Fonction de nettoyage : annuler le timer si le composant est démonté ou si inputSearch change
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line
  }, [inputSearch, socket]); // Ajouter socket aux dépendances si nécessaire (l'eslint rule le suggère)


  // --- Handlers d'actions qui envoient des messages via WebSocket ---
  const sendMessage = () => {
    // Vérifier si le message n'est pas vide, un groupe est sélectionné et le socket est connecté
    if (!input.trim() || !selectedGroup || socket?.readyState !== WebSocket.OPEN) return;

    const payload = {
      action: "new_message",
      group_id: selectedGroup.id,
      message: input,
    };
    socket.send(JSON.stringify(payload));
    setInput(""); // Effacer l'input après envoi
  };

  const handleInvite = (userId: number) => {
     // Cette fonction invite un utilisateur spécifique DANS le groupe ACTUELLEMENT SÉLECTIONNÉ.
     // Si l'objectif est une recherche globale d'ajout d'ami, utiliser handleAddFriend à la place.
     // Le code original semble mélanger les deux. Je vais la laisser mais clarifier son usage.
     if (!selectedGroup || socket?.readyState !== WebSocket.OPEN) return;
     setFeedback(null);
     // Assurez-vous que votre backend gère l'action "invite_user" avec group_id et user_id
     socket.send(JSON.stringify({
       action: "invite_user", // Ou potentiellement "add_member_to_group" selon votre API
       group_id: selectedGroup.id,
       user_id: userId,
     }));
   };


  const handleAddFriend = (userId: number) => {
    // Envoie une demande d'ami à l'utilisateur spécifié
    if (socket?.readyState !== WebSocket.OPEN) return;
    setFeedback(null);
    console.log("Tentative d'ajout d'ami pour userID:", userId);
    socket.send(JSON.stringify({
      action: "add_friend",
      user_id: userId, // L'ID de l'utilisateur à ajouter
    }));
  };

  const handleAcceptFriend = (userId: number) => {
     // Accepte la demande d'ami de l'utilisateur spécifié
     if (socket?.readyState !== WebSocket.OPEN) return;
     setFeedback(null);
     console.log("Tentative d'acceptation d'ami pour userID:", userId);
     socket.send(JSON.stringify({
       action: "accept_friend",
       user_id: userId, // L'ID de l'utilisateur dont on accepte la demande
     }));
   };

   const handleRefuseFriend = (userId: number) => {
     // Refuse la demande d'ami de l'utilisateur spécifié
     if (socket?.readyState !== WebSocket.OPEN) return;
     setFeedback(null);
     console.log("Tentative de refus d'ami pour userID:", userId);
     socket.send(JSON.stringify({
       action: "refuse_friend",
       user_id: userId, // L'ID de l'utilisateur dont on refuse la demande
     }));
   };

   const handleRemoveFriend = (userId: number) => {
      // Supprime un ami existant
     if (socket?.readyState !== WebSocket.OPEN) return;
     setFeedback(null);
     console.log("Tentative de suppression d'ami pour userID:", userId);
     socket.send(JSON.stringify({
       action: "remove_friend",
       user_id: userId, // L'ID de l'ami à supprimer
     }));
   };


  // Fonction pour gérer la création de groupe
  const handleCreateGroup = () => {
    // Vérifier les conditions avant d'envoyer
    if (!newGroupName.trim() || selectedFriendsForGroup.length === 0 || socket?.readyState !== WebSocket.OPEN) {
      setFeedback("Veuillez saisir un nom de groupe et sélectionner au moins un ami.");
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    setFeedback(null); // Effacer les anciens feedbacks
    socket.send(JSON.stringify({
      action: "create_group",
      group_name: newGroupName.trim(),
      users_id: selectedFriendsForGroup, // IDs des amis à ajouter au groupe
    }));
  };

  // Fonction pour gérer la sélection/désélection des amis pour le formulaire de groupe
  const toggleFriendSelection = useCallback((friendId: number) => {
    setSelectedFriendsForGroup(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId) // Désélectionner si déjà sélectionné
        : [...prev, friendId] // Sélectionner sinon
    );
  }, []); // Pas de dépendances car prev est géré par React

  // Filtrer les amis pour le formulaire de création de groupe (seulement les amis "friend")
  const confirmedFriendsForGroup = friends.filter(friend => friend.relation.status === "friend");


  return (
    <div className="flex h-screen">
      {/* Sidebar Component */}
      <ChatSidebar
        groups={groups}
        friends={friends}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        showFriends={showFriends}
        setShowFriends={setShowFriends}
        inputSearch={inputSearch}
        setInputSearch={setInputSearch}
        wsStatus={wsStatus}
        // Props création groupe
        showCreateGroup={showCreateGroup}
        setShowCreateGroup={setShowCreateGroup}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        selectedFriendsForGroup={selectedFriendsForGroup}
        toggleFriendSelection={toggleFriendSelection}
        handleCreateGroup={handleCreateGroup}
      />

      {/* Main Content Area Component */}
      <ChatContentArea
        selectedGroup={selectedGroup}
        showFriends={showFriends}
        selectedMessages={selectedMessages}
        searchResults={searchResults}
        friends={friends}
        currentUserId={currentUserId}
        feedback={feedback}
        wsStatus={wsStatus}
        getFriendshipStatus={getFriendshipStatus}
        handleInvite={handleInvite} // Passe le handler d'invitation (si utilisé)
        handleAddFriend={handleAddFriend} // Passe le handler d'ajout d'ami
        handleAcceptFriend={handleAcceptFriend}
        handleRefuseFriend={handleRefuseFriend}
        handleRemoveFriend={handleRemoveFriend}
        sendMessage={sendMessage}
        input={input} // Passe l'input du message
        setInput={setInput} // Passe le setter de l'input message
      />
    </div>
  );
};

export default ChatPage;
