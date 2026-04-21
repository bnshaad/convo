'use client';

import { useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook to manage user presence (online/offline status)
 * Uses heartbeat approach since Firestore doesn't support onDisconnect
 */
export function usePresence() {
  const { user, isLoggedIn } = useAuthStore();

  const userId = user?.id;

  const setOnline = useCallback(async () => {
    if (!userId) return;

    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      userId: userId
    }, { merge: true });
  }, [userId]);

  const setOffline = useCallback(async () => {
    if (!userId) return;

    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
      userId: userId
    }, { merge: true });
  }, [userId]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    // Set online when component mounts
    setOnline();

    // Heartbeat - update presence every 30 seconds
    const heartbeat = setInterval(setOnline, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      }
    };

    // Handle beforeunload
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [isLoggedIn, userId, setOnline, setOffline]);
}
