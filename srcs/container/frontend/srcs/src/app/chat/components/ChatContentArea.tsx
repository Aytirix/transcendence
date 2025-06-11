// src/components/ChatContentArea.tsx
import React from 'react';
import { Group, Message, Friend, Member } from '../types/chat'; // Assurez-vous que le chemin est correct
import MessageList from './MessageList'; // Assurez-vous que le chemin est correct
import FriendList from './FriendList'; // Assurez-vous que le chemin est correct
import SearchResults from './SearchResults'; // Assurez-vous que le chemin est correct
import MessageInput from './MessageInput'; // Assurez-vous que le chemin est correct
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
  handleAcceptFriend,
  handleRefuseFriend,
  handleRemoveFriend,
  sendMessage,
  input,
  setInput,
}) => {
  const renderContent = () => {
    if (showFriends) {
      return (
        <FriendList
          friends={friends}
          handleAcceptFriend={handleAcceptFriend}
          handleRefuseFriend={handleRefuseFriend}
          handleRemoveFriend={handleRemoveFriend}
        />
      );
    }

    if (searchResults) {
      return (
        <SearchResults
          searchResults={searchResults}
          currentUserId={currentUserId}
          getFriendshipStatus={getFriendshipStatus}
          handleInvite={handleInvite} // Peut être omis si l'invitation se fait uniquement depuis le groupe
          handleAddFriend={handleAddFriend}
        />
      );
    }

    if (selectedGroup) {
      return (
        <MessageList messages={selectedMessages} currentUserId={currentUserId} />
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
      {selectedGroup && !searchResults && !showFriends && (
        <MessageInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          wsStatus={wsStatus}
        />
      )}
    </main>
  );
};

export default ChatContentArea;
