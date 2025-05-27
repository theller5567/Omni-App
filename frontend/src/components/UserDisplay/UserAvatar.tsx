import React from 'react';
import { Avatar, CircularProgress } from '@mui/material';
import { useUserAvatar } from '../../hooks/query-hooks';

interface UserAvatarProps {
  userId?: string;
  fallbackName?: string; // Name to use for initials if avatar fails or no userId
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, fallbackName }) => {
  const { avatar, isLoading } = useUserAvatar(userId);

  if (isLoading) {
    return <CircularProgress size={20} />;
  }

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(fallbackName);

  return (
    <Avatar src={avatar || undefined}>
      {!avatar ? initials : null}
    </Avatar>
  );
};

export default UserAvatar; 