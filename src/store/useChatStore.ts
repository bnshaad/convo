'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { chatService } from '@/lib/services/chatService';
import { useAuthStore } from './useAuthStore';
import { Chat, Message, Notification, MediaItem } from '@/types/chat';
import { User } from '@/types/user';

type ChatErrorScope = 'chats' | 'messages' | 'send' | 'notifications' | 'users';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messagesByChatId: Record<string, Message[]>;
  notifications: Notification[];
  typingByChatId: Record<string, string[]>;
  media: MediaItem[];
  isChatsLoading: boolean;
  isMessagesLoadingByChatId: Record<string, boolean>;
  isSendingByChatId: Record<string, boolean>;
  isDeletingByChatId: Record<string, boolean>;
  isCreatingChat: boolean;
  isNotificationsLoading: boolean;
  isClearingNotifications: boolean;
  errorByScope: Record<ChatErrorScope, string | null>;

  setActiveChat: (id: string | null) => void;
  openChat: (chatId: string) => void;
  closeActiveChat: () => void;
  sendMessage: (chatId: string, text: string, imageUrl?: string) => Promise<void>;
  editMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  addReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  removeReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  createConversation: (participants: User[], name: string, avatar?: string) => Promise<string>;
  createNewChat: (participants: User[], name: string, avatar?: string) => Promise<string>;
  deleteChat: (chatId: string) => Promise<void>;
  markRead: (chatId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  startConversation: (userId: string, userName: string) => Promise<string>;
  queueTypingActivity: (chatId: string) => void;
  stopTyping: (chatId: string) => Promise<void>;
  clearChatError: (scope: ChatErrorScope) => void;
  clearNotificationsError: () => void;

  subscribeToChats: (userId: string) => () => void;
  subscribeToNotifications: (userId: string) => () => void;
}

const EMPTY_ERRORS: Record<ChatErrorScope, string | null> = {
  chats: null,
  messages: null,
  send: null,
  notifications: null,
  users: null
};

let activeMessageUnsubscribe: (() => void) | null = null;
let activeTypingUnsubscribe: (() => void) | null = null;
const typingDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const typingIdleTimers = new Map<string, ReturnType<typeof setTimeout>>();
const typingPublished = new Map<string, boolean>();

const clearTypingTimers = (chatId: string) => {
  const debounceTimer = typingDebounceTimers.get(chatId);
  if (debounceTimer) clearTimeout(debounceTimer);
  typingDebounceTimers.delete(chatId);

  const idleTimer = typingIdleTimers.get(chatId);
  if (idleTimer) clearTimeout(idleTimer);
  typingIdleTimers.delete(chatId);
};

const getUserIds = (chat: Chat) => chat.users.map((user) => user.id);

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    chats: [],
    activeChatId: null,
    messagesByChatId: {},
    notifications: [],
    typingByChatId: {},
    media: [],
    isChatsLoading: false,
    isMessagesLoadingByChatId: {},
    isSendingByChatId: {},
    isDeletingByChatId: {},
    isCreatingChat: false,
    isNotificationsLoading: false,
    isClearingNotifications: false,
    errorByScope: EMPTY_ERRORS,

    setActiveChat: (id) => set({ activeChatId: id }),

    openChat: (chatId) => {
      const currentActiveChatId = get().activeChatId;
      if (currentActiveChatId === chatId) return;

      if (activeMessageUnsubscribe) {
        activeMessageUnsubscribe();
        activeMessageUnsubscribe = null;
      }
      if (activeTypingUnsubscribe) {
        activeTypingUnsubscribe();
        activeTypingUnsubscribe = null;
      }
      if (currentActiveChatId) {
        void get().stopTyping(currentActiveChatId);
      }

      set((state) => ({
        activeChatId: chatId,
        messagesByChatId: state.messagesByChatId[chatId]
          ? state.messagesByChatId
          : { ...state.messagesByChatId, [chatId]: [] },
        typingByChatId: { ...state.typingByChatId, [chatId]: [] },
        isMessagesLoadingByChatId: { ...state.isMessagesLoadingByChatId, [chatId]: true },
        errorByScope: { ...state.errorByScope, messages: null }
      }));

      activeMessageUnsubscribe = chatService.subscribeToMessages(
        chatId,
        (messages) => {
          set((state) => ({
            messagesByChatId: { ...state.messagesByChatId, [chatId]: messages },
            isMessagesLoadingByChatId: { ...state.isMessagesLoadingByChatId, [chatId]: false },
            errorByScope: { ...state.errorByScope, messages: null }
          }));

          const currentUserId = useAuthStore.getState().user?.id;
          if (!currentUserId) return;

          const hasUnread = messages.some((message) => !message.read && message.senderId !== currentUserId);
          if (get().activeChatId === chatId && hasUnread) {
            void get().markRead(chatId);
          }
        },
        (error) =>
          set((state) => ({
            isMessagesLoadingByChatId: { ...state.isMessagesLoadingByChatId, [chatId]: false },
            errorByScope: { ...state.errorByScope, messages: error.message }
          }))
      );

      activeTypingUnsubscribe = chatService.subscribeToTyping(chatId, (userIds) => {
        set((state) => ({
          typingByChatId: { ...state.typingByChatId, [chatId]: userIds }
        }));
      });
    },

    closeActiveChat: () => {
      const activeChatId = get().activeChatId;
      if (activeMessageUnsubscribe) {
        activeMessageUnsubscribe();
        activeMessageUnsubscribe = null;
      }
      if (activeTypingUnsubscribe) {
        activeTypingUnsubscribe();
        activeTypingUnsubscribe = null;
      }
      if (activeChatId) {
        void get().stopTyping(activeChatId);
      }

      set({ activeChatId: null });
    },

    sendMessage: async (chatId, text, imageUrl) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set((state) => ({
          errorByScope: { ...state.errorByScope, send: 'You must be logged in to send messages.' }
        }));
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText && !imageUrl) return;
      if (get().isSendingByChatId[chatId]) return;

      const chat = get().chats.find((item) => item.id === chatId);
      if (!chat) {
        set((state) => ({
          errorByScope: { ...state.errorByScope, send: 'Chat not found.' }
        }));
        return;
      }

      set((state) => ({
        isSendingByChatId: { ...state.isSendingByChatId, [chatId]: true },
        errorByScope: { ...state.errorByScope, send: null }
      }));

      try {
        await chatService.sendMessage(chatId, user.id, user.name, trimmedText, getUserIds(chat), imageUrl);
        await get().stopTyping(chatId);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, send: err.message || 'Failed to send message.' }
        }));
        throw error;
      } finally {
        set((state) => ({
          isSendingByChatId: { ...state.isSendingByChatId, [chatId]: false }
        }));
      }
    },

    editMessage: async (chatId, messageId, newText) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        await chatService.editMessage(chatId, messageId, user.id, newText.trim());
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, messages: err.message }
        }));
      }
    },

    deleteMessage: async (chatId, messageId) => {
      try {
        await chatService.deleteMessage(chatId, messageId);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, messages: err.message }
        }));
      }
    },

    addReaction: async (chatId, messageId, emoji) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        await chatService.addReaction(chatId, messageId, user.id, emoji);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, messages: err.message }
        }));
      }
    },

    removeReaction: async (chatId, messageId, emoji) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        await chatService.removeReaction(chatId, messageId, user.id, emoji);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, messages: err.message }
        }));
      }
    },

    createConversation: async (participants, name, avatar) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      try {
        set((state) => ({
          isCreatingChat: true,
          errorByScope: { ...state.errorByScope, chats: null }
        }));
        return await chatService.createConversation(participants, name, user, avatar);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, chats: err.message || 'Failed to create chat.' }
        }));
        throw error;
      } finally {
        set({ isCreatingChat: false });
      }
    },

    createNewChat: async (participants, name, avatar) => get().createConversation(participants, name, avatar),

    deleteChat: async (chatId) => {
      const isActiveChat = get().activeChatId === chatId;

      set((state) => ({
        isDeletingByChatId: { ...state.isDeletingByChatId, [chatId]: true },
        errorByScope: { ...state.errorByScope, chats: null, messages: null }
      }));

      try {
        if (isActiveChat) {
          get().closeActiveChat();
        }

        await chatService.deleteConversation(chatId);

        set((state) => {
          const nextMessagesByChatId = { ...state.messagesByChatId };
          delete nextMessagesByChatId[chatId];

          const nextTypingByChatId = { ...state.typingByChatId };
          delete nextTypingByChatId[chatId];

          const nextLoadingByChatId = { ...state.isMessagesLoadingByChatId };
          delete nextLoadingByChatId[chatId];

          const nextSendingByChatId = { ...state.isSendingByChatId };
          delete nextSendingByChatId[chatId];

          const nextDeletingByChatId = { ...state.isDeletingByChatId };
          delete nextDeletingByChatId[chatId];

          return {
            chats: state.chats.filter((chat) => chat.id !== chatId),
            activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
            messagesByChatId: nextMessagesByChatId,
            typingByChatId: nextTypingByChatId,
            isMessagesLoadingByChatId: nextLoadingByChatId,
            isSendingByChatId: nextSendingByChatId,
            isDeletingByChatId: nextDeletingByChatId,
            notifications: state.notifications.filter((notification) => notification.conversationId !== chatId)
          };
        });
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          isDeletingByChatId: { ...state.isDeletingByChatId, [chatId]: false },
          errorByScope: { ...state.errorByScope, chats: err.message || 'Failed to delete chat.' }
        }));
        throw error;
      }
    },

    markRead: async (chatId) => {
      const user = useAuthStore.getState().user;
      if (!user || get().activeChatId !== chatId) return;

      try {
        await chatService.markMessagesAsRead(chatId, user.id);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, messages: err.message }
        }));
      }
    },

    clearNotifications: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      set((state) => ({
        isClearingNotifications: true,
        errorByScope: { ...state.errorByScope, notifications: null }
      }));

      try {
        await chatService.clearNotifications(user.id);
      } catch (error) {
        const err = error as Error;
        set((state) => ({
          errorByScope: { ...state.errorByScope, notifications: err.message || 'Failed to clear notifications.' }
        }));
      } finally {
        set({ isClearingNotifications: false });
      }
    },

    startConversation: async (targetUserId, targetUserName) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const existing = get().chats.find((chat) =>
        chat.users.length === 2 &&
        chat.users.some((chatUser) => chatUser.id === targetUserId) &&
        chat.users.some((chatUser) => chatUser.id === user.id)
      );

      if (existing) return existing.id;
      return get().createConversation([{ id: targetUserId, name: targetUserName }], targetUserName);
    },

    queueTypingActivity: (chatId) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const existingDebounce = typingDebounceTimers.get(chatId);
      if (existingDebounce) clearTimeout(existingDebounce);

      typingDebounceTimers.set(
        chatId,
        setTimeout(async () => {
          if (!typingPublished.get(chatId)) {
            typingPublished.set(chatId, true);
            await chatService.setTyping(chatId, user.id, true);
          }
        }, 400)
      );

      const existingIdle = typingIdleTimers.get(chatId);
      if (existingIdle) clearTimeout(existingIdle);

      typingIdleTimers.set(
        chatId,
        setTimeout(() => {
          void get().stopTyping(chatId);
        }, 1500)
      );
    },

    stopTyping: async (chatId) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      clearTypingTimers(chatId);
      if (!typingPublished.get(chatId)) return;

      typingPublished.set(chatId, false);
      await chatService.setTyping(chatId, user.id, false);
    },

    clearChatError: (scope) =>
      set((state) => ({
        errorByScope: { ...state.errorByScope, [scope]: null }
      })),

    clearNotificationsError: () =>
      set((state) => ({
        errorByScope: { ...state.errorByScope, notifications: null }
      })),

    subscribeToChats: (userId) => {
      set((state) => ({
        isChatsLoading: true,
        errorByScope: { ...state.errorByScope, chats: null }
      }));

      return chatService.subscribeToConversations(
        userId,
        (chats) => set({ chats, isChatsLoading: false }),
        (error) =>
          set((state) => ({
            isChatsLoading: false,
            errorByScope: { ...state.errorByScope, chats: error.message }
          }))
      );
    },

    subscribeToNotifications: (userId) => {
      set((state) => ({
        isNotificationsLoading: true,
        errorByScope: { ...state.errorByScope, notifications: null }
      }));

      return chatService.subscribeToNotifications(
        userId,
        (notifications) =>
          set({
            notifications,
            isNotificationsLoading: false
          }),
        (error) =>
          set((state) => ({
            isNotificationsLoading: false,
            errorByScope: { ...state.errorByScope, notifications: error.message }
          }))
      );
    }
  }))
);
