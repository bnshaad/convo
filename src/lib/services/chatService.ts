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
  increment,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message, Notification, Participant } from '@/types/chat';
import { User } from '@/types/user';

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
};

const toFirestoreParticipant = (participant: Participant): Participant => ({
  id: participant.id,
  name: participant.name,
  ...(participant.avatar ? { avatar: participant.avatar } : {})
});

const mapConversation = (id: string, data: DocumentData, userId: string): Chat => {
  const users = Array.isArray(data.participants)
    ? data.participants.filter(isUser)
    : [];

  return {
    id,
    users,
    name: typeof data.name === 'string' ? data.name : undefined,
    unreadCount: typeof data.unreadCount?.[userId] === 'number' ? data.unreadCount[userId] : 0,
    lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : undefined,
    timestamp: data.updatedAt
      ? new Date((data.updatedAt as Timestamp).toMillis()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '',
    avatar: typeof data.avatar === 'string'
      ? data.avatar
      : typeof data.name === 'string'
        ? data.name.charAt(0).toUpperCase()
        : users[0]?.name?.charAt(0).toUpperCase() || '?',
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toMillis() : Date.now()
  };
};

const mapMessage = (id: string, chatId: string, data: DocumentData): Message => ({
  id,
  chatId,
  text: data.text || '',
  senderId: data.senderId || '',
  createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
  read: data.read || false,
  imageUrl: data.imageUrl,
  reactions: data.reactions || {},
  editedAt: data.editedAt ? (data.editedAt as Timestamp).toMillis() : undefined,
  replyTo: data.replyTo
});

/**
 * Service to handle all Firestore chat operations.
 * Separates Firebase SDK logic from state management.
 */
export const chatService = {
  // --- Conversations ---

  subscribeToConversations: (userId: string, callback: (chats: Chat[]) => void, onError: (error: Error) => void) => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      callback(snapshot.docs.map((doc) => mapConversation(doc.id, doc.data(), userId)));
    }, onError);
  },

  createConversation: async (
    participants: Participant[],
    name: string,
    creator: Participant,
    avatar?: string
  ): Promise<string> => {
    const participantMap = new Map<string, Participant>();
    [creator, ...participants].forEach((participant) => {
      participantMap.set(participant.id, toFirestoreParticipant(participant));
    });

    const allParticipants = Array.from(participantMap.values());
    const unreadCount: Record<string, number> = {};
    allParticipants.forEach(({ id }) => {
      unreadCount[id] = 0;
    });

    const docRef = await addDoc(collection(db, 'conversations'), {
      name,
      participantIds: allParticipants.map(({ id }) => id),
      participants: allParticipants,
      unreadCount,
      updatedAt: serverTimestamp(),
      createdBy: creator.id,
      ...(avatar && { avatar })
    });

    return docRef.id;
  },

  // --- Messages ---

  subscribeToMessages: (conversationId: string, callback: (messages: Message[]) => void, onError: (error: Error) => void) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((doc) => mapMessage(doc.id, conversationId, doc.data())));
    }, onError);
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, where('read', '==', false));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((snap) => {
      if (snap.data().senderId !== userId) {
        batch.update(snap.ref, { read: true });
      }
    });

    // Also reset unread count for this user
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0
    });

    await batch.commit();
  },

  sendMessage: async (conversationId: string, senderId: string, senderName: string, text: string, participantIds: string[], imageUrl?: string): Promise<void> => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const conversationRef = doc(db, 'conversations', conversationId);

    const messageData = {
      text,
      senderId,
      createdAt: serverTimestamp(),
      read: false,
      reactions: {}
    } as Record<string, unknown>;
    if (imageUrl) messageData.imageUrl = imageUrl;

    await addDoc(messagesRef, messageData);

    // Update conversation and notifications
    const otherParticipants = participantIds.filter(id => id !== senderId);
    const updateData: Record<string, unknown> = {
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
      await deleteDoc(typingRef).catch(() => { });
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
  },

  // --- Notifications ---

  subscribeToNotifications: (
    userId: string,
    callback: (notifications: Notification[]) => void,
    onError?: (error: Error) => void
  ) => {
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
          read: data.read || false,
          conversationId: data.conversationId
        };
      });
      callback(notifications);
    }, onError);
  },

  clearNotifications: async (userId: string) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }
};
