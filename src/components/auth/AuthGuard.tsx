'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard Component
 *
 * Protects routes in the (app) group.
 * Redirects to home page if user is not authenticated.
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isLoggedIn, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until auth initialization is complete
    if (isLoading) return;

    if (!isLoggedIn) {
      console.log('Not logged in, redirecting to welcome page...');
      // Use replace to prevent back-button loops
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, router, pathname]);

  // Show nothing or a dedicated loading screen while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-nb-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[4px] border-nb-black border-t-transparent animate-spin" />
          <span className="font-black uppercase tracking-widest text-sm opacity-30">Authenticating...</span>
        </div>
      </div>
    );
  }

  // If not logged in, we return null while the redirect happens above
  if (!isLoggedIn) return null;

  return <>{children}</>;
};
