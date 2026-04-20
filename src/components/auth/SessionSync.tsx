'use client';

import { useEffect } from 'react';
import { initAuthListener } from '@/store/useAuthStore';

/**
 * SessionSync Component
 *
 * Initializes Firebase Auth state listener on app mount.
 * Keeps Zustand auth state synchronized with Firebase Auth.
 */
export const SessionSync = () => {
  useEffect(() => {
    // Initialize Firebase auth listener
    initAuthListener();
  }, []);

  return null;
};
