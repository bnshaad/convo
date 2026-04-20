'use client';

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/store/useUserStore';

/**
 * Service to handle all User and Profile operations.
 * Separates Firebase SDK logic from state management.
 */
export const userService = {
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
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
        lastActive: (data.lastActive as Timestamp)?.toMillis(),
        createdAt: (data.createdAt as Timestamp)?.toMillis()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  searchUsers: async (searchQuery: string, currentUserId: string): Promise<UserProfile[]> => {
    if (!searchQuery.trim()) return [];

    try {
      const usersRef = collection(db, 'users');
      const searchLower = searchQuery.toLowerCase();

      const q = query(
        usersRef,
        where('searchKeywords', 'array-contains', searchLower),
        limit(20)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email,
            avatar: data.avatar,
            status: data.status,
            lastActive: (data.lastActive as Timestamp)?.toMillis(),
            createdAt: (data.createdAt as Timestamp)?.toMillis()
          };
        })
        .filter((user) => user.id !== currentUserId);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  createOrUpdateProfile: async (userId: string, name: string, email?: string, avatar?: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      const profileData = {
        name,
        email: email || null,
        avatar: avatar || null,
        lastActive: serverTimestamp(),
        searchKeywords: generateSearchKeywords(name)
      };

      if (userSnap.exists()) {
        await updateDoc(userRef, profileData);
      } else {
        await setDoc(userRef, {
          ...profileData,
          createdAt: serverTimestamp()
        });
      }
      
      return profileData;
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  }
};

// Helper to generate search keywords from name
function generateSearchKeywords(name: string): string[] {
  const keywords: string[] = [];
  const lower = name.toLowerCase();

  // Add full name
  keywords.push(lower);

  // Add parts
  const parts = lower.split(/\s+/);
  parts.forEach((part) => {
    for (let i = 1; i <= part.length && i <= 10; i++) {
      keywords.push(part.substring(0, i));
    }
  });

  return [...new Set(keywords)];
}
