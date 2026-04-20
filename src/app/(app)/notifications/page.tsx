'use client';

import { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { NbButton } from '@/components/ui/NbButton';
import { NbCard } from '@/components/ui/NbCard';
import { Bell, User, TriangleAlert, Heart, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, clearNotifications } = useChatStore();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearNotifications();
      setIsClearing(false);
    }, 300);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <User className="w-5 h-5" />;
      case 'system':
        return <TriangleAlert className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5 fill-current" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-nb-cream flex flex-col p-4 md:p-6 pb-32 relative overflow-x-hidden">
      
      {/* Raw Typographic Heading */}
      <h1 className="text-[28px] font-black uppercase tracking-tight text-nb-black mb-8">
        Notifications
      </h1>

      <div className="flex flex-col gap-6 max-w-md w-full mx-auto">
        
        {/* Alert Banner - Shows only when there are unread notifications */}
        {notifications.filter(n => !n.type || n.type === 'message').length > 0 && (
          <div className="bg-nb-coral border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] p-5 flex items-center gap-4">
            <Bell className="w-6 h-6 text-white" strokeWidth={3} />
            <span className="text-white font-black text-[18px] uppercase tracking-wide">
              You have new messages
            </span>
          </div>
        )}

        {/* Clear All Top Button */}
        {notifications.length > 0 && (
          <NbButton 
            className="w-full bg-nb-coral text-white border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] font-black uppercase py-4"
            onClick={handleClearAll}
          >
            Clear All
          </NbButton>
        )}

        {/* Notifications List */}
        <div 
          className={`flex flex-col gap-4 transition-opacity duration-300 ${isClearing ? 'opacity-0' : 'opacity-100'}`}
        >
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-nb-black/40 font-bold uppercase tracking-widest">
              No new notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <NbCard 
                key={notif.id} 
                className="flex items-center gap-4 p-4 border-[2px] border-nb-black shadow-[3px_3px_0px_#0D0D0D]"
              >
                {/* Avatar Square */}
                <div className="w-12 h-12 border-[2px] border-nb-black bg-nb-card flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {notif.senderName && (
                      <span className="font-black text-nb-black truncate max-w-[120px]">
                        {notif.senderName}
                      </span>
                    )}
                    <span className="text-sm font-bold text-nb-black/80 truncate">
                      {notif.message}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[12px] opacity-40 font-bold uppercase">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>
              </NbCard>
            ))
          )}
        </div>
      </div>

      {/* Pinned Clear All Bottom Button */}
      {notifications.length > 0 && (
         <div className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto md:relative md:bottom-auto md:left-auto md:right-auto md:mt-8">
            <NbButton
              className="w-full bg-nb-coral text-white border-[3px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] font-black uppercase py-4"
              onClick={handleClearAll}
            >
              Clear All
            </NbButton>
         </div>
      )}

      {/* Fixed Bottom Nav Bar (Matches other pages) */}
    </div>
  );
}
