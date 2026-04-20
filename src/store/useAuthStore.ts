import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;

  // Internal
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Convert Firebase user to our User type
const formatUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
  email: firebaseUser.email || undefined,
  avatar: firebaseUser.photoURL || undefined
});

// Lazy import to avoid circular dependency: useAuthStore <-> useUserStore
const syncUserProfile = async () => {
  const { useUserStore } = await import('@/store/useUserStore');
  await useUserStore.getState().createOrUpdateProfile();
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: true,
      error: null,

      setUser: (user) => set({
        user,
        isLoggedIn: !!user,
        isLoading: false
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          const user = formatUser(result.user);
          set({ user, isLoggedIn: true, isLoading: false });
          // Sync profile to Firestore users collection so this user is discoverable
          await syncUserProfile();
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(result.user, { displayName });
          const user = formatUser(result.user);
          set({ user, isLoggedIn: true, isLoading: false });
          // Create profile in Firestore users collection so this user is discoverable
          await syncUserProfile();
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await firebaseSignOut(auth);
          set({ user: null, isLoggedIn: false, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Logout failed',
            isLoading: false
          });
          throw error;
        }
      },
    }),
    {
      name: 'neo-auth-storage',
      partialize: (state) => ({
        // Only persist user data, not loading states or errors
        user: state.user
      })
    }
  )
);

// Initialize auth state listener (call this once in your app)
export const initAuthListener = () => {
  const { setUser, setLoading } = useAuthStore.getState();

  setLoading(true);

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser && !firebaseUser.isAnonymous) {
      setUser(formatUser(firebaseUser));
      // Sync on every session restore — keeps lastActive fresh
      // and ensures searchKeywords exist for pre-existing users
      await syncUserProfile();
    } else {
      if (firebaseUser?.isAnonymous) {
        await firebaseSignOut(auth);
      }
      setUser(null);
    }
  });
};