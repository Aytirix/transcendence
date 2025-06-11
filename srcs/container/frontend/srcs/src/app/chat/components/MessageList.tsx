// src/components/MessageList.tsx
import React from 'react';
import { Message } from '../types/chat'; // Assurez-vous que le chemin est correct

interface MessageListProps {
  messages: Message[];
  currentUserId: number | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  return (
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
          <div>{m.sender_id === currentUserId ? "Vous" : m.sender_id}: {m.message}</div> {/* Peut-être afficher le nom de l'expéditeur si disponible */}
          <div className="text-xs text-gray-500 text-right">
            {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ""}
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-8">Aucun message dans cette conversation.</div>
      )}
    </div>
  );
};

export default MessageList;
