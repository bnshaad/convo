'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './useAuthStore';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: string;
  lastActive?: number;
  createdAt?: number;
}

interface UserState {
  users: UserProfile[];
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  searchUsers: (searchQuery: string) => Promise<UserProfile[]>;
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createOrUpdateProfile: () => Promise<void>;

  // Subscriptions
  subscribeToUsers: () => () => void;
}

export const useUserStore = create<UserState>()(
  subscribeWithSelector((set, get) => ({
    users: [],
    currentUserProfile: null,
    isLoading: false,
    error: null,

    searchUsers: async (searchQuery) => {
      if (!searchQuery.trim()) return [];

      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return [];

      try {
        const usersRef = collection(db, 'users');
        const searchLower = searchQuery.toLowerCase();

        // Search by name (case-insensitive search using array-contains)
        const q = query(
          usersRef,
          where('searchKeywords', 'array-contains', searchLower),
          orderBy('lastActive', 'desc'),
          limit(20)
        );

        const snapshot = await getDocs(q);
        const users: UserProfile[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unknown',
              email: data.email,
              avatar: data.avatar,
              status: data.status,
              lastActive: data.lastActive?.toMillis(),
              createdAt: data.createdAt?.toMillis()
            };
          })
          .filter((user) => user.id !== currentUser.id); // Exclude current user

        return users;
      } catch (error: any) {
        console.error('Error searching users:', error);
        return [];
      }
    },

    getUserProfile: async (userId) => {
      try {
        const userRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
          id: snapshot.id,
          name: data.name || 'Unknown',
          email: data.email,
          avatar: data.avatar,
          status: data.status,
          lastActive: data.lastActive?.toMillis(),
          createdAt: data.createdAt?.toMillis()
        };
      } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
    },

    updateProfile: async (updates) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) throw new Error('Not authenticated');

      try {
        const userRef = doc(db, 'users', currentUser.id);
        const updateData: any = { ...updates };

        // Regenerate search keywords if name changed
        if (updates.name) {
          updateData.searchKeywords = generateSearchKeywords(updates.name);
        }

        await updateDoc(userRef, updateData);
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    createOrUpdateProfile: async () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.id);
        const userSnap = await getDoc(userRef);

        const profileData = {
          name: currentUser.name,
          email: currentUser.email || null,
          avatar: currentUser.avatar || null,
          lastActive: serverTimestamp(),
          searchKeywords: generateSearchKeywords(currentUser.name)
        };

        if (userSnap.exists()) {
          await updateDoc(userRef, profileData);
        } else {
          await setDoc(userRef, {
            ...profileData,
            createdAt: serverTimestamp()
          });
        }

        set({ currentUserProfile: { id: currentUser.id, ...profileData } as UserProfile });
      } catch (error) {
        console.error('Error creating/updating profile:', error);
      }
    },

    subscribeToUsers: () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastActive', 'desc'), limit(100));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users: UserProfile[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email,
            avatar: data.avatar,
            status: data.status,
            lastActive: data.lastActive?.toMillis(),
            createdAt: data.createdAt?.toMillis()
          };
        });

        set({ users });
      }, (error) => {
        console.error('Error subscribing to users:', error);
      });

      return unsubscribe;
    }
  }))
);

// Helper to generate search keywords from name
function generateSearchKeywords(name: string): string[] {
  const keywords: string[] = [];
  const lower = name.toLowerCase();

  // Add full name
  keywords.push(lower);

  // Add parts
  const parts = lower.split(/\s+/);
  parts.forEach((part) => {
    // Add prefixes for partial matching
    for (let i = 1; i <= part.length && i <= 10; i++) {
      keywords.push(part.substring(0, i));
    }
  });

  return [...new Set(keywords)];
}
