import type { Chat } from '@/types/chat';

export const getChatDisplayName = (chat: Chat, currentUserId?: string) => {
  if (chat.users.length === 2 && currentUserId) {
    const otherUser = chat.users.find((user) => user.id !== currentUserId);
    if (otherUser?.name) {
      return otherUser.name;
    }
  }

  return chat.name || 'Unnamed Chat';
};
