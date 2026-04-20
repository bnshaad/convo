import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  darkMode: boolean;
  notifPush: boolean;
  notifEmail: boolean;
  privacyOnline: boolean;
  privacyReceipts: boolean;
  accessibility: boolean;
  language: string;
  fontSize: string;
  
  setDarkMode: (val: boolean) => void;
  setNotifPush: (val: boolean) => void;
  setNotifEmail: (val: boolean) => void;
  setPrivacyOnline: (val: boolean) => void;
  setPrivacyReceipts: (val: boolean) => void;
  setAccessibility: (val: boolean) => void;
  setLanguage: (val: string) => void;
  setFontSize: (val: string) => void;
  
  updateSettings: (settings: Partial<Omit<SettingsState, 'setDarkMode' | 'setNotifPush' | 'setNotifEmail' | 'setPrivacyOnline' | 'setPrivacyReceipts' | 'setAccessibility' | 'setLanguage' | 'setFontSize' | 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      notifPush: true,
      notifEmail: false,
      privacyOnline: true,
      privacyReceipts: true,
      accessibility: false,
      language: 'english',
      fontSize: 'medium',

      setDarkMode: (val) => set({ darkMode: val }),
      setNotifPush: (val) => set({ notifPush: val }),
      setNotifEmail: (val) => set({ notifEmail: val }),
      setPrivacyOnline: (val) => set({ privacyOnline: val }),
      setPrivacyReceipts: (val) => set({ privacyReceipts: val }),
      setAccessibility: (val) => set({ accessibility: val }),
      setLanguage: (val) => set({ language: val }),
      setFontSize: (val) => set({ fontSize: val }),
      
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'nb-chat-settings',
    }
  )
);
