import { useState } from 'react';

interface UserProfileModalState {
  isOpen: boolean;
  userId: number | null;
  username: string;
}

export const useUserProfileModal = () => {
  const [modalState, setModalState] = useState<UserProfileModalState>({
    isOpen: false,
    userId: null,
    username: ''
  });

  const openUserProfile = (userId: number, username: string) => {
    setModalState({
      isOpen: true,
      userId,
      username
    });
  };

  const closeUserProfile = () => {
    setModalState({
      isOpen: false,
      userId: null,
      username: ''
    });
  };

  return {
    modalState,
    openUserProfile,
    closeUserProfile
  };
};
