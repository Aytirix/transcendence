import React, { ChangeEvent } from 'react';

interface AvatarSelectorProps {
  defaultAvatars: string[];
  handleAvatarSelect: (avatar: string) => void;
  handleCustomAvatar: (e: ChangeEvent<HTMLInputElement>) => void;
  customAvatar: string | null;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  defaultAvatars,
  handleAvatarSelect,
  handleCustomAvatar,
  customAvatar
}) => (
  <div className="avatar-group">
    {defaultAvatars.map((avatar, idx) => (
      <div className="avatar" key={avatar}>
        <div className=" rounded-full" >
          <img
            src={avatar}
            alt={`Avatar ${idx + 1}`}
            onClick={() => handleAvatarSelect(avatar)}
          />
        </div>
      </div>
    ))}
    <label>
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCustomAvatar}
      />
      {customAvatar ? (
        <div className="avatar">
          <div className=" rounded-full" >
            <img className="w-30 h-30 rounded" src={customAvatar} alt="Custom Avatar" />
          </div>
        </div>
      ) : (
        <span>+ Ajouter</span>
      )}
    </label>
  </div>
);

export default AvatarSelector;
