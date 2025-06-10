import React, { useEffect, useState } from "react";
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

const endpoint = `/chat`;

const ChatPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const socket = useSafeWebSocket({
    endpoint,
    onMessage: (data) => {
      if (!data.action) {
        console.log("erreur WS reçu :", data);
        return;
      }
      if (data.action !== "pong" && data.action !== "init_connected")
        console.log("Message WS reçu :", data);

      switch (data.action) {
        case "new_message":
          // la payload attendue: { action, result, group_id, message }
          // ici, message reçu = data.message
          if (
            selectedGroup &&
            data.group_id === selectedGroup.id &&
            data.result === "ok" &&
            data.message
          ) {
            setMessages((prev) => [...prev, data.message]);
          }
          break;
        case "loadMoreMessage":
          if (data.messages && typeof data.messages === "object") {
            // Convertit l'objet messages en tableau, trié par id croissant
            const arr = Object.values(data.messages) as Message[];
            arr.sort((a, b) => a.id - b.id);
            setMessages(arr);
          } else {
            setMessages([]);
          }
          break;
        case "pong":
          // laisse vide ici, spécifique à ton usage
          break;
        case "init_connected": {
          const groupArray: Group[] = Object.values(data.groups);
          setGroups(groupArray);
          if (groupArray.length) setSelectedGroup(groupArray[0]);
          if (data.user?.id) setCurrentUserId(data.user.id);
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
    if (!socket || !selectedGroup) return;
    socket.send(
      JSON.stringify({
        action: "loadMoreMessage",
        group_id: selectedGroup.id,
        firstMessageId: 0,
      })
    );
    setMessages([]);
  }, [selectedGroup, socket]);

  const sendMessage = () => {
    if (!input.trim() || !selectedGroup || !socket || wsStatus !== "Connected") return;
    const payload = {
      action: "new_message",
      group_id: selectedGroup.id,
      message: input,
    };
    socket.send(JSON.stringify(payload));
    setInput("");
    // Ne rien ajouter à messages ici !
  };

  const sendSearch = () => {
    if (!inputSearch.trim() || !socket || wsStatus !== "Connected") return;
    const payload = {
      action: "search_user",
      name: inputSearch,
      group_id: null,
    };
    socket.send(JSON.stringify(payload));
    setInputSearch("");
  };

  return (
    <div className="flex h-screen">
      {/* MENU LATÉRAL GROUPES */}
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
            placeholder="Rechercher un groupe ou user"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendSearch()}
          />
        </label>
        <div className="p-4 font-bold text-xl">Groupes</div>
        <div className="flex-1 overflow-auto">
          {groups.map((g) => (
            <button
              key={g.id}
              className={`w-full text-left p-4 hover:bg-blue-200 focus:bg-blue-300 ${selectedGroup?.id === g.id ? "bg-blue-200 font-bold" : ""}`}
              onClick={() => setSelectedGroup(g)}
            >
              {g.name || g.members.map(m => m.username).join(', ')}
            </button>
          ))}
        </div>
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
      {/* CHAT */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b font-semibold text-lg">
          {selectedGroup
            ? `Discussion de groupe : ${selectedGroup.name || selectedGroup.members.map(m => m.username).join(', ')}`
            : "Sélectionne un groupe..."}
        </header>
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
          {messages.map((m, idx) => (
            <div
              key={m.id ?? idx}
              className={`max-w-xl ${
                m.sender_id === currentUserId
                  ? "ml-auto bg-blue-200"
                  : "mr-auto bg-white"
              } p-2 rounded shadow`}
            >
              <div>{m.message}</div>
              <div className="text-xs text-gray-500 text-right">
                {m.sent_at
                  ? new Date(m.sent_at).toLocaleTimeString()
                  : ""}
              </div>
            </div>
          ))}
        </div>
        {selectedGroup && (
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
