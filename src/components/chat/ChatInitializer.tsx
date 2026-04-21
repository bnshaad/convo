'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * ChatInitializer Component
 *
 * Automatically subscribes to conversations and notifications when user is logged in.
 * Creates/updates user profile in Firestore for user discovery.
 */
export const ChatInitializer = () => {
  const { user, isLoggedIn } = useAuthStore();
  const subscribeToChats = useChatStore((state) => state.subscribeToChats);
  const subscribeToNotifications = useChatStore((state) => state.subscribeToNotifications);
  const createOrUpdateProfile = useUserStore((state) => state.createOrUpdateProfile);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    // Create or update user profile for discovery
    createOrUpdateProfile();

    // Subscribe to conversations and notifications
    const unsubscribeConversations = subscribeToChats(user.id);
    const unsubscribeNotifications = subscribeToNotifications(user.id);

    return () => {
      unsubscribeConversations();
      unsubscribeNotifications();
    };
  }, [isLoggedIn, user?.id, subscribeToChats, subscribeToNotifications, createOrUpdateProfile]);

  return null;
};
