'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { chatService } from '@/lib/services/chatService';
import { useAuthStore } from './useAuthStore';
import { Message, Conversation, Notification } from '@/types/chat';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  notifications: Notification[];
  typingIndicators: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, text: string, imageUrl?: string) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, newText: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  addReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  removeReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  createConversation: (participants: string[], name: string, avatar?: string) => Promise<string>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  markRead: (conversationId: string) => Promise<void>;
  startConversation: (userId: string, userName: string) => Promise<string>;

  // Subscriptions
  subscribeToConversations: (userId: string) => () => void;
  subscribeToMessages: (conversationId: string) => () => void;
  subscribeToNotifications: (userId: string) => () => void;
  subscribeToTypingIndicators: (conversationId: string) => () => void;
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    notifications: [],
    typingIndicators: {},
    isLoading: false,
    error: null,

    setActiveConversation: (id) => set({ activeConversationId: id }),

    sendMessage: async (conversationId, text, imageUrl) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const conversation = get().conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      try {
        await chatService.sendMessage(
          conversationId,
          user.id,
          user.name,
          text,
          conversation.participantIds,
          imageUrl
        );
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    editMessage: async (conversationId, messageId, newText) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await chatService.editMessage(conversationId, messageId, user.id, newText);
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    deleteMessage: async (conversationId, messageId) => {
      try {
        await chatService.deleteMessage(conversationId, messageId);
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    addReaction: async (conversationId, messageId, emoji) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await chatService.addReaction(conversationId, messageId, user.id, emoji);
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    removeReaction: async (conversationId, messageId, emoji) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await chatService.removeReaction(conversationId, messageId, user.id, emoji);
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    createConversation: async (participants, name, avatar) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');
      return await chatService.createConversation(participants, name, user.id, avatar);
    },

    setTyping: async (conversationId, isTyping) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      await chatService.setTyping(conversationId, user.id, isTyping);
    },

    markRead: async (conversationId) => {
      const user = useAuthStore.getState().user;
      if (!user) return;
      try {
        await chatService.markMessagesAsRead(conversationId, user.id);
      } catch (error: any) {
        console.error('Error marking as read:', error);
      }
    },

    startConversation: async (targetUserId, targetUserName) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');

      const existing = get().conversations.find(c => 
        c.participantIds.includes(targetUserId) && 
        c.participantIds.includes(user.id) && 
        c.participantIds.length === 2
      );

      if (existing) return existing.id;
      return await get().createConversation([targetUserId], targetUserName);
    },

    subscribeToConversations: (userId) => {
      set({ isLoading: true });
      return chatService.subscribeToConversations(
        userId,
        (conversations) => set({ conversations, isLoading: false }),
        (error) => set({ error: error.message, isLoading: false })
      );
    },

    subscribeToMessages: (conversationId) => {
      return chatService.subscribeToMessages(
        conversationId,
        (messages) => set((state) => ({
          messages: { ...state.messages, [conversationId]: messages }
        })),
        (error) => console.error('Message sub error:', error)
      );
    },

    subscribeToNotifications: (userId) => {
      return chatService.subscribeToNotifications(
        userId,
        (notifications) => set({ notifications })
      );
    },

    subscribeToTypingIndicators: (conversationId) => {
      return chatService.subscribeToTyping(
        conversationId,
        (userIds) => set((state) => ({
          typingIndicators: { ...state.typingIndicators, [conversationId]: userIds }
        }))
      );
    }
  }))
);
