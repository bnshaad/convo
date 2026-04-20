'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NbSkeleton } from '@/components/ui/NbSkeleton';

export default function ChatsPage() {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const isGuest = user?.id?.startsWith('guest-');

  // Simulate loading for the skeleton demo
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-nb-cream text-nb-black relative pb-24 md:pb-8">
      {/* Fixed Header */}
      <header className="px-4 pt-6 md:pt-8 pb-5 shrink-0 flex flex-col gap-5 sticky top-0 bg-nb-cream border-b-[3px] border-nb-black z-20">
        <h1 className="text-center font-black text-[22px] uppercase tracking-wider">
          Conversations
        </h1>
        
        {/* Search Input */}
        <div className="relative isolate">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
             <Search className="w-5 h-5 text-nb-black" strokeWidth={3} />
          </div>
          <input 
            type="text" 
            placeholder="Search messages..." 
            className="w-full bg-nb-card border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] py-3.5 pl-11 pr-4 text-nb-black font-bold text-[16px] outline-none placeholder:text-nb-black/80 focus:ring-0"
          />
        </div>
      </header>

      {/* Conversation List Scrollable */}
      <main className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4">
        {/* Guest Banner */}
        {isGuest && showBanner && !isLoading && (
          <div className="mt-4 bg-nb-yellow border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] p-4 relative flex flex-col gap-2 transition-all duration-300">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 w-7 h-7 bg-white border-[2.5px] border-nb-black flex items-center justify-center shadow-[2px_2px_0_var(--nb-black)] transition-all hover:bg-nb-black hover:text-white hover:shadow-[3px_3px_0_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <X className="w-4 h-4" strokeWidth={4} />
            </button>
            <p className="font-bold text-[14px] leading-tight pr-8">
              You&apos;re chatting as a Guest — your messages won&apos;t be saved after you close the tab.
            </p>
            <Link 
              href="/register" 
              className="font-black text-[13px] uppercase underline decoration-2 underline-offset-2 hover:text-nb-coral transition-colors w-fit"
            >
              Sign up to save your history
            </Link>
          </div>
        )}

        {isLoading ? (
          // Skeleton Loader
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full bg-nb-card/40 border-[3px] border-nb-black/20 p-[10px] pl-3 flex items-center gap-3">
              <NbSkeleton variant="rect" className="w-[50px] h-[50px] shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <NbSkeleton className="h-4 w-32" />
                <NbSkeleton className="h-3 w-48" />
              </div>
            </div>
          ))
        ) : (
          conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => router.push(`/chats/${chat.id}`)}
              className="w-full text-left bg-nb-yellow border-[3px] border-nb-black shadow-[5px_5px_0px_var(--nb-black)] p-[10px] pl-3 flex items-center gap-3 transition-all hover:shadow-[7px_7px_0px_var(--nb-black)] hover:-translate-y-[2px] hover:-translate-x-[1px] active:translate-y-[3px] active:translate-x-[2px] active:shadow-[1px_1px_0px_var(--nb-black)]"
            >
              {/* Square Avatar Wrapper */}
              <div className="relative shrink-0 flex items-center justify-center group">
                  <svg viewBox="0 0 50 50" className="w-[50px] h-[50px] shrink-0 border-[3px] border-nb-black bg-nb-card transition-colors group-hover:bg-nb-yellow">
                    <rect x="5" y="5" width="40" height="40" fill="var(--nb-black)" stroke="var(--nb-card)" strokeWidth="2.5" />
                    <rect x="0" y="0" width="50" height="50" fill="none" stroke="var(--nb-black)" strokeWidth="2.5" />
                  </svg>
                  
                  {/* Unread badge square */}
                  {chat.unreadCount ? (
                    <div className="absolute -top-[5px] -right-[5px] w-[22px] h-[22px] bg-nb-coral border-[2.5px] border-nb-black flex items-center justify-center z-10 transition-transform group-active:scale-95">
                      <span className="text-white font-black text-[12px] leading-none">{chat.unreadCount}</span>
                    </div>
                  ) : null}
               </div>

               {/* Chat Content Body */}
               <div className="flex-1 min-w-0 pr-1 pl-1">
                 <h2 className="font-black text-[16.5px] truncate leading-tight tracking-tight mb-[3px] uppercase">{chat.name}</h2>
                 <p className="font-bold text-[13.5px] leading-tight truncate text-nb-black/85">{chat.lastMessage}</p>
               </div>

               {/* Timestamp */}
               <div className="shrink-0 self-start mt-1 mr-1">
                 <span className="text-[12px] font-black text-nb-black tracking-tight opacity-60">{chat.timestamp}</span>
               </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}
