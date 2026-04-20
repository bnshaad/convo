'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthStore } from './useAuthStore';

// Types
export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
  read: boolean;
  imageUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  editedAt?: number;
  replyTo?: string; // messageId being replied to
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
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail?: string;
  extension?: string;
  conversationId: string;
  uploadedAt: number;
  uploadedBy: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  notifications: Notification[];
  media: MediaItem[];
  typingIndicators: Record<string, string[]>; // conversationId -> userIds
  userPresence: Record<string, UserPresence>; // userId -> presence
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, message: { text: string; senderId: string; imageUrl?: string; replyTo?: string }) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, newText: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  addReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  removeReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  markRead: (conversationId: string, messageId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string, userId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  createConversation: (participants: string[], name: string, avatar?: string) => Promise<string>;
  leaveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  uploadMedia: (conversationId: string, file: File) => Promise<string | null>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  startConversation: (userId: string, userName: string) => Promise<string>;

  // Subscriptions
  subscribeToConversations: (userId: string) => () => void;
  subscribeToMessages: (conversationId: string) => () => void;
  subscribeToNotifications: (userId: string) => () => void;
  subscribeToTypingIndicators: (conversationId: string) => () => void;
  subscribeToUserPresence: (userIds: string[]) => () => void;
}

// Helper to convert Firestore timestamp to number
const timestampToNumber = (timestamp: Timestamp | null): number => {
  return timestamp?.toMillis() || Date.now();
};

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    notifications: [],
    media: [],
    typingIndicators: {},
    userPresence: {},
    isLoading: false,
    error: null,

    setActiveConversation: (id) => {
      set({ activeConversationId: id });
      if (id) {
        get().subscribeToMessages(id);
      }
    },

    sendMessage: async (conversationId, messagePartial) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const conversationRef = doc(db, 'conversations', conversationId);

      try {
        // Add message to subcollection
        const messageData: any = {
          text: messagePartial.text,
          senderId: messagePartial.senderId,
          createdAt: serverTimestamp(),
          read: false,
          reactions: {}
        };

        if (messagePartial.imageUrl) messageData.imageUrl = messagePartial.imageUrl;
        if (messagePartial.replyTo) messageData.replyTo = messagePartial.replyTo;

        await addDoc(messagesRef, messageData);

        // Update conversation last message and unread counts for other participants
        const conversation = get().conversations.find(c => c.id === conversationId);
        const otherParticipants = conversation?.participantIds.filter(id => id !== currentUser.id) || [];

        const updateData: any = {
          lastMessage: messagePartial.imageUrl ? '📷 Image' : messagePartial.text,
          updatedAt: serverTimestamp()
        };

        // Increment unread count for other participants
        otherParticipants.forEach((participantId: string) => {
          updateData[`unreadCount.${participantId}`] = increment(1);
        });

        await updateDoc(conversationRef, updateData);

        // Create notification for other participants
        if (otherParticipants.length > 0) {
          for (const participantId of otherParticipants) {
            const notificationsRef = collection(db, 'notifications');
            await addDoc(notificationsRef, {
              type: 'message',
              senderName: currentUser.name,
              message: messagePartial.imageUrl ? 'Sent an image' : messagePartial.text,
              timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              createdAt: serverTimestamp(),
              userId: participantId,
              read: false,
              conversationId
            });
          }
        }
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error sending message:', error);
      }
    },

    editMessage: async (conversationId, messageId, newText) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) throw new Error('Message not found');

        const messageData = messageSnap.data();
        if (messageData.senderId !== currentUser.id) {
          throw new Error('Can only edit your own messages');
        }

        await updateDoc(messageRef, {
          text: newText,
          editedAt: serverTimestamp()
        });
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error editing message:', error);
      }
    },

    deleteMessage: async (conversationId, messageId) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) throw new Error('Message not found');

        const messageData = messageSnap.data();

        // Allow deletion if user is sender or conversation admin
        if (messageData.senderId !== currentUser.id) {
          const conversationRef = doc(db, 'conversations', conversationId);
          const conversationSnap = await getDoc(conversationRef);
          const conversationData = conversationSnap.data();

          if (conversationData?.createdBy !== currentUser.id) {
            throw new Error('Can only delete your own messages');
          }
        }

        // If message has an image, delete from storage
        if (messageData.imageUrl) {
          try {
            const imageRef = ref(storage, messageData.imageUrl);
            await deleteObject(imageRef);
          } catch (storageError) {
            console.error('Error deleting image from storage:', storageError);
          }
        }

        await deleteDoc(messageRef);
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error deleting message:', error);
      }
    },

    addReaction: async (conversationId, messageId, emoji) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) throw new Error('Message not found');

        const messageData = messageSnap.data();
        const reactions = messageData.reactions || {};

        // Remove user from all other reactions (only one reaction per user)
        Object.keys(reactions).forEach((key: string) => {
          if (reactions[key]?.includes(currentUser.id)) {
            reactions[key] = reactions[key].filter((id: string) => id !== currentUser.id);
          }
        });

        // Add user to new reaction
        if (!reactions[emoji]) reactions[emoji] = [];
        reactions[emoji].push(currentUser.id);

        await updateDoc(messageRef, { reactions });
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error adding reaction:', error);
      }
    },

    removeReaction: async (conversationId, messageId, emoji) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
        await updateDoc(messageRef, {
          [`reactions.${emoji}`]: arrayRemove(currentUser.id)
        });
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error removing reaction:', error);
      }
    },

    markRead: async (conversationId, messageId) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      try {
        await updateDoc(messageRef, { read: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },

    markConversationAsRead: async (conversationId, userId) => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          [`unreadCount.${userId}`]: 0
        });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    },

    clearNotifications: async () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('userId', '==', currentUser.id), where('read', '==', false));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        await batch.commit();

        set({ notifications: [] });
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error clearing notifications:', error);
      }
    },

    createConversation: async (participants, name, avatar) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      const allParticipants = [...new Set([...participants, currentUser.id])];

      // Initialize unread counts for all participants
      const unreadCount: Record<string, number> = {};
      allParticipants.forEach((id: string) => {
        unreadCount[id] = 0;
      });

      try {
        const conversationsRef = collection(db, 'conversations');
        const docRef = await addDoc(conversationsRef, {
          name,
          participantIds: allParticipants,
          unreadCount,
          updatedAt: serverTimestamp(),
          createdBy: currentUser.id,
          ...(avatar && { avatar })
        });

        return docRef.id;
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    leaveConversation: async (conversationId) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        if (!conversationSnap.exists()) throw new Error('Conversation not found');

        const conversationData = conversationSnap.data();

        // Cannot leave if you're the creator (or handle differently)
        if (conversationData.createdBy === currentUser.id) {
          // Creator leaving - delete the conversation entirely
          await get().deleteConversation(conversationId);
          return;
        }

        // Remove user from participants
        await updateDoc(conversationRef, {
          participantIds: arrayRemove(currentUser.id)
        });

        // Add system message
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, {
          text: `${currentUser.name} left the conversation`,
          senderId: 'system',
          createdAt: serverTimestamp(),
          read: false,
          system: true
        });
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error leaving conversation:', error);
      }
    },

    deleteConversation: async (conversationId) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);

        if (!conversationSnap.exists()) throw new Error('Conversation not found');

        const conversationData = conversationSnap.data();

        // Only creator can delete
        if (conversationData.createdBy !== currentUser.id) {
          throw new Error('Only the creator can delete this conversation');
        }

        // Delete all messages in the conversation
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const messagesSnap = await getDocs(messagesRef);

        const batch = writeBatch(db);
        messagesSnap.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete the conversation
        batch.delete(conversationRef);
        await batch.commit();
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error deleting conversation:', error);
      }
    },

    uploadMedia: async (conversationId, file) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExtension}`;
        const filePath = `conversations/${conversationId}/media/${fileName}`;
        const storageRef = ref(storage, filePath);

        // Upload file
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        // Determine media type
        let mediaType: 'image' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';

        // Add media record to conversation
        const mediaRef = collection(db, 'conversations', conversationId, 'media');
        await addDoc(mediaRef, {
          type: mediaType,
          url: downloadUrl,
          conversationId,
          uploadedAt: serverTimestamp(),
          uploadedBy: currentUser.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type
        });

        return downloadUrl;
      } catch (error: any) {
        set({ error: error.message });
        console.error('Error uploading media:', error);
        return null;
      }
    },

    setTyping: async (conversationId, isTyping) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const typingRef = doc(db, 'conversations', conversationId, 'typing', currentUser.id);

        if (isTyping) {
          await updateDoc(typingRef, {
            userId: currentUser.id,
            timestamp: serverTimestamp()
          }).catch(async () => {
            // Document doesn't exist, create it
            await addDoc(collection(db, 'conversations', conversationId, 'typing'), {
              userId: currentUser.id,
              timestamp: serverTimestamp()
            });
          });
        } else {
          // Remove typing indicator
          await deleteDoc(typingRef).catch(() => {
            // Document might not exist, ignore error
          });
        }
      } catch (error) {
        console.error('Error setting typing status:', error);
      }
    },

    startConversation: async (targetUserId, targetUserName) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      const state = get();
      
      // Check if 1-on-1 conversation already exists
      const existingConv = state.conversations.find(c => 
        c.participantIds.includes(targetUserId) && 
        c.participantIds.includes(currentUser.id) && 
        c.participantIds.length === 2
      );

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      return await state.createConversation([targetUserId], targetUserName);
    },

    subscribeToConversations: (userId) => {
      set({ isLoading: true });

      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Chat',
            participantIds: data.participantIds || [],
            unreadCount: data.unreadCount?.[userId] || 0,
            lastMessage: data.lastMessage || '',
            timestamp: data.updatedAt
              ? new Date(data.updatedAt.toMillis()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : '',
            avatar: data.avatar || data.name?.charAt(0).toUpperCase() || '?',
            updatedAt: timestampToNumber(data.updatedAt)
          };
        });

        set({ conversations, isLoading: false });
      }, (error) => {
        console.error('Error subscribing to conversations:', error);
        set({ error: error.message, isLoading: false });
      });

      return unsubscribe;
    },

    subscribeToMessages: (conversationId) => {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text || '',
            senderId: data.senderId || '',
            createdAt: timestampToNumber(data.createdAt),
            read: data.read || false,
            imageUrl: data.imageUrl,
            reactions: data.reactions || {},
            editedAt: data.editedAt ? timestampToNumber(data.editedAt) : undefined,
            replyTo: data.replyTo
          };
        });

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: messages
          }
        }));
      }, (error) => {
        console.error('Error subscribing to messages:', error);
      });

      return unsubscribe;
    },

    subscribeToTypingIndicators: (conversationId) => {
      const typingRef = collection(db, 'conversations', conversationId, 'typing');

      const unsubscribe = onSnapshot(typingRef, (snapshot) => {
        const typingUserIds: string[] = [];
        const now = Date.now();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toMillis() || 0;

          // Only show typing if within last 10 seconds
          if (now - timestamp < 10000) {
            typingUserIds.push(data.userId);
          }
        });

        set((state) => ({
          typingIndicators: {
            ...state.typingIndicators,
            [conversationId]: typingUserIds
          }
        }));
      }, (error) => {
        console.error('Error subscribing to typing indicators:', error);
      });

      return unsubscribe;
    },

    subscribeToUserPresence: (userIds) => {
      const presenceData: Record<string, UserPresence> = {};

      const unsubscribes = userIds.map((userId) => {
        const presenceRef = doc(db, 'presence', userId);

        return onSnapshot(presenceRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            presenceData[userId] = {
              userId,
              online: data.online || false,
              lastSeen: data.lastSeen?.toMillis()
            };
          } else {
            presenceData[userId] = {
              userId,
              online: false
            };
          }

          set({ userPresence: { ...presenceData } });
        }, (error) => {
          console.error('Error subscribing to user presence:', error);
        });
      });

      // Return combined unsubscribe function
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    },

    subscribeToNotifications: (userId) => {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type || 'message',
            senderName: data.senderName,
            message: data.message || '',
            timestamp: data.timestamp || '',
            createdAt: timestampToNumber(data.createdAt),
            userId: data.userId,
            read: data.read || false
          };
        });

        set({ notifications });
      }, (error) => {
        console.error('Error subscribing to notifications:', error);
      });

      return unsubscribe;
    }
  }))
);
