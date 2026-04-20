'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Settings, Bell } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

export const NbBottomNav = () => {
  const pathname = usePathname();
  const { conversations } = useChatStore();

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  const navItems = [
    { href: '/chats', icon: MessageSquare, label: 'Chats', unread: totalUnread },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-nb-cream border-t-[3px] border-nb-black flex items-center justify-around z-[999]">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex-1 h-full flex items-center justify-center relative cursor-pointer"
          >
            <div className={`flex flex-col items-center justify-center pointer-events-none transition-colors ${isActive ? 'text-nb-yellow' : 'text-nb-black'}`}>
              <Icon className="w-8 h-8" strokeWidth={3} fill={isActive ? 'currentColor' : 'none'} />
            </div>

            {/* Notification Badge */}
            {item.unread && item.unread > 0 ? (
              <div className="absolute top-2 right-[20%] bg-nb-coral border-2 border-nb-black px-1.5 h-4 flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-black text-white leading-none">
                  {item.unread > 9 ? '9+' : item.unread}
                </span>
              </div>
            ) : null}

            {/* Visual Indicator for Active Tab */}
            {isActive && (
              <div className="absolute bottom-0 left-4 right-4 h-1 bg-nb-yellow pointer-events-none" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
