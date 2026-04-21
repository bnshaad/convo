'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { userService } from '@/lib/services/userService';
import { useAuthStore } from './useAuthStore';
import { UserProfile } from '@/types/user';

interface UserState {
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  searchUsers: (searchQuery: string) => Promise<UserProfile[]>;
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  createOrUpdateProfile: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  subscribeWithSelector((set) => ({
    currentUserProfile: null,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    searchUsers: async (searchQuery) => {
      const user = useAuthStore.getState().user;
      if (!user) return [];
      set({ isLoading: true, error: null });
      try {
        return await userService.searchUsers(searchQuery, user.id);
      } catch (error) {
        const err = error as Error;
        set({ error: err.message });
        return [];
      } finally {
        set({ isLoading: false });
      }
    },

    getUserProfile: async (userId) => {
      return await userService.getUserProfile(userId);
    },

    createOrUpdateProfile: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        set({ isLoading: true, error: null });
        const profileData = await userService.createOrUpdateProfile(
          user.id,
          user.name,
          user.email,
          user.avatar
        );

        set({
          currentUserProfile: {
            id: user.id,
            name: profileData.name,
            email: profileData.email || undefined,
            avatar: profileData.avatar || undefined,
            lastActive: Date.now()
          }
        });
      } catch (error) {
        const err = error as Error;
        set({ error: err.message });
      } finally {
        set({ isLoading: false });
      }
    }
  }))
);
