export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
  read: boolean;
  imageUrl?: string;
  reactions?: Record<string, string[]>;
  editedAt?: number;
  replyTo?: string;
}

export interface Conversation {
  id: string;
  name: string;
  participantIds: string[];
  unreadCount: number;
  lastMessage?: string;
  timestamp?: string;
  avatar?: string;
  updatedAt: number;
}

export interface Notification {
  id: string;
  type: 'message' | 'system' | 'like';
  senderName?: string;
  message: string;
  timestamp: string;
  createdAt: number;
  userId: string;
  read: boolean;
  conversationId?: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  timestamp: number;
}

export interface UserPresence {
  userId: string;
  online: boolean;
  lastSeen?: number;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  thumbnail?: string;
  extension?: string;
  senderId?: string;
  createdAt: number;
}
