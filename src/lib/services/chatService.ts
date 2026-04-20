'use client';

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  arrayRemove,
  increment,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types/user';
import { Conversation, Message, Notification } from '@/types/chat';

/**
 * Service to handle all Firestore chat operations.
 * Separates Firebase SDK logic from state management.
 */
export const chatService = {
  // --- Conversations ---

  subscribeToConversations: (userId: string, callback: (conversations: Conversation[]) => void, onError: (error: any) => void) => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const conversations: Conversation[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Chat',
          participantIds: data.participantIds || [],
          unreadCount: data.unreadCount?.[userId] || 0,
          lastMessage: data.lastMessage || '',
          timestamp: data.updatedAt
            ? new Date((data.updatedAt as Timestamp).toMillis()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : '',
          avatar: data.avatar || data.name?.charAt(0).toUpperCase() || '?',
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toMillis() : Date.now()
        };
      });
      callback(conversations);
    }, onError);
  },

  createConversation: async (participants: string[], name: string, creatorId: string, avatar?: string): Promise<string> => {
    const allParticipants = [...new Set([...participants, creatorId])];
    const unreadCount: Record<string, number> = {};
    allParticipants.forEach(id => {
      unreadCount[id] = 0;
    });

    const docRef = await addDoc(collection(db, 'conversations'), {
      name,
      participantIds: allParticipants,
      unreadCount,
      updatedAt: serverTimestamp(),
      createdBy: creatorId,
      ...(avatar && { avatar })
    });

    return docRef.id;
  },

  // --- Messages ---

  subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void, onError: (error: any) => void) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId || '',
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
          read: data.read || false,
          imageUrl: data.imageUrl,
          reactions: data.reactions || {},
          editedAt: data.editedAt ? (data.editedAt as Timestamp).toMillis() : undefined,
          replyTo: data.replyTo
        };
      });
      callback(messages);
    }, onError);
  },

  sendMessage: async (conversationId: string, senderId: string, senderName: string, text: string, participantIds: string[], imageUrl?: string): Promise<void> => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const conversationRef = doc(db, 'conversations', conversationId);

    const messageData: any = {
      text,
      senderId,
      createdAt: serverTimestamp(),
      read: false,
      reactions: {}
    };
    if (imageUrl) messageData.imageUrl = imageUrl;

    await addDoc(messagesRef, messageData);

    // Update conversation and notifications
    const otherParticipants = participantIds.filter(id => id !== senderId);
    const updateData: any = {
      lastMessage: imageUrl ? '📷 Image' : text,
      updatedAt: serverTimestamp()
    };

    otherParticipants.forEach(id => {
      updateData[`unreadCount.${id}`] = increment(1);
    });

    await updateDoc(conversationRef, updateData);

    // Create notifications
    if (otherParticipants.length > 0) {
      const batch = writeBatch(db);
      otherParticipants.forEach(userId => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          type: 'message',
          senderName,
          message: imageUrl ? 'Sent an image' : text,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          createdAt: serverTimestamp(),
          userId,
          read: false,
          conversationId
        });
      });
      await batch.commit();
    }
  },

  editMessage: async (conversationId: string, messageId: string, senderId: string, newText: string) => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText,
      editedAt: serverTimestamp()
    });
  },

  deleteMessage: async (conversationId: string, messageId: string) => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await deleteDoc(messageRef);
  },

  addReaction: async (conversationId: string, messageId: string, userId: string, emoji: string) => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) return;
    
    const data = messageSnap.data();
    const reactions = data.reactions || {};
    
    // Standardize: one reaction per user per message
    Object.keys(reactions).forEach(key => {
      if (reactions[key]?.includes(userId)) {
        reactions[key] = reactions[key].filter((id: string) => id !== userId);
      }
    });

    if (!reactions[emoji]) reactions[emoji] = [];
    reactions[emoji].push(userId);
    
    await updateDoc(messageRef, { reactions });
  },

  removeReaction: async (conversationId: string, messageId: string, userId: string, emoji: string) => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) return;
    
    const data = messageSnap.data();
    const reactions = data.reactions || {};
    
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
    }
    
    await updateDoc(messageRef, { reactions });
  },

  setTyping: async (conversationId: string, userId: string, isTyping: boolean) => {
    const typingRef = doc(db, 'conversations', conversationId, 'typing', userId);
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        timestamp: serverTimestamp()
      });
    } else {
      await deleteDoc(typingRef).catch(() => {});
    }
  },

  subscribeToTyping: (conversationId: string, callback: (userIds: string[]) => void) => {
    const typingRef = collection(db, 'conversations', conversationId, 'typing');
    return onSnapshot(typingRef, (snapshot) => {
      const now = Date.now();
      const typingUserIds = snapshot.docs
        .map(doc => doc.data())
        .filter(data => (now - (data.timestamp?.toMillis() || 0)) < 10000)
        .map(data => data.userId);
      callback(typingUserIds);
    });
  }
};

  // --- Notifications ---

  subscribeToNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'message',
          senderName: data.senderName,
          message: data.message || '',
          timestamp: data.timestamp || '',
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
          userId: data.userId,
          read: data.read || false
        };
      });
      callback(notifications);
    });
  }
};
