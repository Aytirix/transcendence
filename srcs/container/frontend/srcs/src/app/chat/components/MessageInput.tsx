// src/components/MessageInput.tsx
import React from 'react';
import { WebSocketStatus } from '../types/chat'; // Assurez-vous que le chemin est correct

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => void;
  wsStatus: WebSocketStatus;
}

const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  sendMessage,
  wsStatus,
}) => {
  const isDisabled = wsStatus !== "Connected";

  return (
    <footer className="p-4 border-t flex space-x-2">
      <input
        type="text"
        className="flex-1 border rounded p-2"
        placeholder="Tape un message…"
        value={input}
        disabled={isDisabled}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendMessage()}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={sendMessage}
        disabled={isDisabled}
      >
        Envoyer
      </button>
    </footer>
  );
};

export default MessageInput;
