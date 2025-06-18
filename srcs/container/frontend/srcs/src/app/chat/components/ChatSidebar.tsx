// src/components/ChatSidebar.tsx
import React from 'react';
import { Group, Friend, WebSocketStatus } from '../types/chat'; // Assurez-vous que le chemin est correct

interface ChatSidebarProps {
  groups: Group[];
  friends: Friend[];
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  showFriends: boolean;
  setShowFriends: (show: boolean) => void;
  inputSearch: string;
  setInputSearch: (input: string) => void;
  wsStatus: WebSocketStatus;

  // Props pour la création de groupe
  showCreateGroup: boolean;
  setShowCreateGroup: (show: boolean) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  selectedFriendsForGroup: number[];
  toggleFriendSelection: (friendId: number) => void;
  handleCreateGroup: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  groups,
  friends,
  selectedGroup,
  setSelectedGroup,
  showFriends,
  setShowFriends,
  inputSearch,
  setInputSearch,
  wsStatus,
  showCreateGroup,
  setShowCreateGroup,
  newGroupName,
  setNewGroupName,
  selectedFriendsForGroup,
  toggleFriendSelection,
  handleCreateGroup,
}) => {
  // Filtrer les amis qui sont vraiment des amis (pas en attente)
  console.log("frtiend",friends);
  // const confirmedFriends = friends.filter(friend => friend.relation.status === "friend");

  return (
    <aside className="w-64 bg-gray-100 border-r flex flex-col">
      <div className="p-4 font-bold text-xl">Groupes</div>

      {/* Section de création de groupe */}
      <div className="px-4 pb-2">
        <button
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          onClick={() => setShowCreateGroup(!showCreateGroup)}
        >
          {showCreateGroup ? "Annuler la création" : "Créer un groupe"}
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
            <div className="max-h-32 overflow-y-auto space-y-1 border p-1 rounded"> {/* Added border and padding */}
              {friends.length === 0 ? (
                <div className="text-xs text-gray-500">Aucun ami disponible pour la création de groupe.</div>
              ) : (
                (friends ?? []).map(f => (
                  <label key={f.id} className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFriendsForGroup.includes(f.id)}
                      onChange={() => toggleFriendSelection(f.id)}
                      className="form-checkbox" // Added class for styling
                    />
                    <span>{f.username}</span>
                  </label>
                ))
              )}
            </div>

            <button
              className="w-full p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || selectedFriendsForGroup.length === 0}
            >
              Créer
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto"> {/* Changed to overflow-y-auto */}
        {groups.map((g) => (
          
          <button
            key={g.id}
            className={`w-full text-left p-4 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 ${selectedGroup?.id === g.id && !showFriends ? "bg-blue-200 font-bold" : ""}`} // Improved focus and transition
            onClick={() => {
              setSelectedGroup(g);
              setShowFriends(false);
            }}
          >
            {console.log( "group", g)}
            {g.name || g.members.map(m => m.username).join(', ')} {/* Group name or member list for private chats */}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
