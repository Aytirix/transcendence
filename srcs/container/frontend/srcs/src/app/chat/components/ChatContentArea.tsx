// src/components/ChatContentArea.tsx
import React from 'react';
import { Group, Message, Friend, Member } from '../types/chat'; // Assurez-vous que le chemin est correct
import { WebSocketStatus } from '../../../api/useSafeWebSocket'; // Assurez-vous que le chemin est correct

interface ChatContentAreaProps {
  selectedGroup: Group | null;
  showFriends: boolean;
  selectedMessages: Message[];
  searchResults: Member[] | null;
  friends: Friend[];
  currentUserId: number | null;
  feedback: string | null;
  wsStatus: WebSocketStatus;
  // Handlers passés de ChatPage
  getFriendshipStatus: (userId: number) => "none" | "pending" | "friend";
  handleInvite: (userId: number) => void;
  handleAddFriend: (userId: number) => void;
  handleAcceptFriend: (userId: number) => void;
  handleRefuseFriend: (userId: number) => void;
  handleRemoveFriend: (userId: number) => void;
  sendMessage: () => void;
  input: string; // Pour l'input du message
  setInput: (input: string) => void; // Pour l'input du message
}

const ChatContentArea: React.FC<ChatContentAreaProps> = ({
  selectedGroup,
  showFriends,
  selectedMessages,
  searchResults,
  friends,
  currentUserId,
  feedback,
  wsStatus,
  getFriendshipStatus,
  handleInvite,
  handleAddFriend,
  sendMessage,
  input,
  setInput,
}) => {
  const renderContent = () => {
    if (searchResults?.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-8">Aucun utilisateur trouvé.</div>
      );
    }
    else {
      <ul className="list bg-base-100 rounded-box shadow-md">
        {searchResults?.map(user => {
          const friendshipStatus = getFriendshipStatus(user.id);
          const isCurrentUser = user.id === currentUserId;

          return (
            <li className="list-row flex justify-between w-full items-center" key={user.id}>
              <div className="flex gap-4 items-center">
                <div className="avatar">
                  <div className="w-18 rounded-full"><img src={`https://${window.location.hostname}:3000/avatars/${user.avatar}`} alt="A" /></div></div>
                <div className="w-40 text-left">{user.username}</div>
                <div className="w-6 rounded-full"><img src={`https://${window.location.hostname}:3000/flags/${user.lang}_flat.png`} alt="A" /></div>
              </div>
              <div className="flex-1">
              </div>
              {/* BOUTONS ACTIONS */}
              <div className="flex space-x-2">
                {!isCurrentUser && friendshipStatus === "none" && (
                  <button
                    className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    onClick={() => handleAddFriend(user.id)}
                  >
                    Ajouter ami
                  </button>
                )}
                {/* Bouton Inviter dans un groupe, si la recherche est liée à un groupe spécifique */}
                {/* {!isCurrentUser && selectedGroup && !selectedGroup.members.some(m => m.id === user.id) && (
                <button
                  className="text-sm px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                  onClick={() => handleInvite(user.id)}
                >
                  Inviter dans le groupe
                </button>
              )} */}
              </div>
            </li>
          );
        })}
      </ul>
    }

    if (selectedGroup) {
      return (
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
          {selectedMessages.map((m, idx) => (
            <div
              key={m.id ?? idx}
              className={`max-w-xl ${m.sender_id === currentUserId
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
          {selectedMessages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">Aucun message dans cette conversation.</div>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Sélectionnez un groupe ou un ami pour commencer à discuter.
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col">
      <header className="p-4 border-b font-semibold text-lg">
        {showFriends ? (
          `Liste des amis (${friends.length})`
        ) : searchResults ? (
          "Résultats de recherche"
        ) : (
          selectedGroup
            ? `Discussion de groupe : ${selectedGroup.name || selectedGroup.members.map(m => m.username).join(', ')}`
            : "Sélectionnez un groupe..."
        )}
      </header>
      {feedback && (
        <div className="m-4 p-2 bg-green-200 rounded text-green-900 text-center">{feedback}</div>
      )}

      {renderContent()}

      {/* Message Input Area - seulement si un groupe est sélectionné et qu'on ne voit pas les amis ou les résultats de recherche */}
      {selectedGroup && !searchResults && (
        <footer className="p-4 border-t flex space-x-2">
          <input
            type="text"
            className="flex-1 border rounded p-2"
            placeholder="Tape un message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={sendMessage}
          >
            Envoyer
          </button>
        </footer>
      )}
    </main>
  );
};

export default ChatContentArea;
