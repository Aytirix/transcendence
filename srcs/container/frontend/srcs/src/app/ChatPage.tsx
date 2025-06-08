import React, { useEffect, useState } from "react";
import useSafeWebSocket, { WebSocketStatus } from "../api/useSafeWebSocket";

// Types
type User = { id: number; username: string };
type Friend = User;
type Message = {
  id: number;
  from: number;
  to: number;
  content: string;
  date: string;
};

const CURRENT_USER: User = { id: 42, username: "Moi" };
const MOCKED_FRIENDS: Friend[] = [
  { id: 1, username: "Alice" },
  { id: 2, username: "Bob" },
];

const endpoint = `/chat`;

const ChatPage: React.FC = () => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(MOCKED_FRIENDS[0]);
  const [friends] = useState<Friend[]>(MOCKED_FRIENDS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("Connecting...");

  const socket = useSafeWebSocket({
    endpoint,
    onMessage: (data) => {
      console.log("Message WS reçu :", data);
      if (!data.action) {
        console.log("erreur WS reçu :", data);
        return;
      }
      switch (data.action) {
        case "new_message":
          const m: Message = data.data || data;
          if (
            selectedFriend &&
            ((m.from === CURRENT_USER.id && m.to === selectedFriend.id) ||
              (m.from === selectedFriend.id && m.to === CURRENT_USER.id))
          ) {
            setMessages((prev) => [...prev, m]);
          }
          break;
        case "loadMoreMessage":
          if (Array.isArray(data.data)) setMessages(data.data);
          break;
        case "pong":
          if (Array.isArray(data.data)) setMessages(data.data);
          break;
        default:
          console.log("Message WS reçu :", data);
        // autres cases selon besoins
      }
    },
    onStatusChange: setWsStatus,
    reconnectDelay: 1000,
    maxReconnectAttempts: 15,
    pingInterval: 30000,
  });

  useEffect(() => {
    if (!socket || !selectedFriend) return;
    socket.send(JSON.stringify({
      
  "action": "loadMoreMessage",
  "group_id": 38,
  "firstMessageId": 0

    }));
    setMessages([]);
    console.log("api url", socket.onmessage?.toString());
  }, [selectedFriend, socket]);

  const sendMessage = () => {
    if (!input.trim() || !selectedFriend || !socket || wsStatus !== "Connected") return;
    const payload = {
  "action": "new_message",
  "group_id": 38,
  "message": input,

    };
    // {
    // const payload = {

    //   "action": "accept_friend",
    //   "user_id": 50

    // };
    console.log("Envoi du message au serveur :", payload);
    socket.send(JSON.stringify(payload));
    console.log("Envoi du message au serveur :", JSON.stringify(payload));
    setInput("");
    // console.log("retour", socket.onmessage);
  };

    const sendSearch = () => {
    if (!inputSearch.trim() || !selectedFriend || !socket || wsStatus !== "Connected") return;
    const payload = {

  "action": "search_user",
  "name": inputSearch,
  "group_id": null


    };
    // {
    // const payload = {

    //   "action": "accept_friend",
    //   "user_id": 50

    // };
    console.log("Envoi du message au serveur :", payload);
    socket.send(JSON.stringify(payload));
    console.log("Envoi du message au serveur :", JSON.stringify(payload));
    setInputSearch("");
    // console.log("retour", socket.onmessage);
  };

  return (
    <div className="flex h-screen">
      {/* Friend Menu */}
      <aside className="w-64 bg-gray-100 border-r flex flex-col">
        <label className="input" >
          <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input type="search" className="grow" placeholder="Search friends" value={inputSearch} onChange={(e) => setInputSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendSearch()}/>
        </label>
        <div className="p-4 font-bold text-xl">Amis</div>
        <div className="flex-1 overflow-auto">
          {friends.map((f) => (
            <button
              key={f.id}
              className={`w-full text-left p-4 hover:bg-blue-200 focus:bg-blue-300 ${selectedFriend?.id === f.id ? "bg-blue-200 font-bold" : ""}`}
              onClick={() => setSelectedFriend(f)}
            >
              {f.username}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-700 p-2">
          Statut du chat: <span className={
            wsStatus === "Connected" ? "text-green-600" :
              wsStatus === "Error" ? "text-red-500" :
                "text-yellow-600"
          }>{wsStatus}</span>
        </div>
      </aside>
      {/* Chat Section */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b font-semibold text-lg">
          {selectedFriend ? `Discussion avec ${selectedFriend.username}` : "Sélectionne un ami..."}
        </header>
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-xl ${m.from === CURRENT_USER.id ? "ml-auto bg-blue-200" : "mr-auto bg-white"} p-2 rounded shadow`}
            >
              <div>{m.content}</div>
              <div className="text-xs text-gray-500 text-right">
                {new Date(m.date).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        {selectedFriend && (
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
