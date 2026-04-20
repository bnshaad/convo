'use client';

import { useSettingsStore } from '@/store/useSettingsStore';
import { useEffect, useState, ReactNode } from 'react';

export const ZustandProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const { darkMode } = useSettingsStore();

  // Handle hydration
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsHydrated(true);
    });
  }, []);

  // Handle theme synchronization
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode, isHydrated]);

  if (!isHydrated) {
    return <div className="min-h-screen bg-[#FFF8F0]" />; // Global background while hydrating
  }

  return <>{children}</>;
};
