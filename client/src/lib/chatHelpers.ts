import type { Chat, User } from '@/types';

export const getChatDisplayInfo = (chat: Chat, currentUserId: string): { name: string; avatar: string | null; isBot: boolean; isOnline: boolean } => {
  if (chat.type === 'GROUP') {
    return { name: chat.name ?? 'Group Chat', avatar: null, isBot: false, isOnline: false };
  }

  const other = chat.members.find((m) => m.userId !== currentUserId)?.user as User | undefined;
  return {
    name: other?.name ?? 'Unknown',
    avatar: other?.avatar ?? null,
    isBot: other?.isBot ?? false,
    isOnline: other?.isOnline ?? false,
  };
};

export const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();