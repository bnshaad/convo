'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Settings, X, LogOut, Search, Bell, Plus } from 'lucide-react';
import { cn } from '@/lib/nb';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';
import { NbModal } from '@/components/ui/NbModal';
import { UserSearch } from '@/components/UserSearch';

interface NbSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Chats', icon: MessageSquare, href: '/chats' },
  { name: 'Search', icon: Search, href: '/search' },
  { name: 'Notifications', icon: Bell, href: '/notifications' },
  { name: 'Profile', icon: User, href: '/profile' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export const NbSidebar = ({ isOpen, onClose }: NbSidebarProps) => {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 w-[280px] bg-nb-card border-r-[3px] border-nb-black z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-nb-card">
          {/* Header */}
          <div className="p-6 border-b-[3px] border-nb-black flex items-center justify-between">
            <h2 className="font-black text-2xl uppercase tracking-tighter">CONVO</h2>
            <button
              onClick={onClose}
              className="md:hidden w-10 h-10 border-2 border-nb-black flex items-center justify-center bg-white shadow-[2px_2px_0_var(--nb-black)] transition-all hover:shadow-[4px_4px_0_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
            {/* New Chat Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-4 p-4 mb-2 font-black uppercase tracking-tight bg-nb-blue text-white border-[3px] border-nb-black shadow-[4px_4px_0_var(--nb-black)] transition-all hover:shadow-[6px_6px_0_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Plus className="w-6 h-6" strokeWidth={4} />
              <span>New Chat</span>
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 p-4 font-black uppercase tracking-tight border-[3px] border-transparent transition-all",
                    isActive 
                      ? "bg-nb-yellow border-nb-black shadow-[4px_4px_0_var(--nb-black)] translate-x-[-2px] translate-y-[-2px]" 
                      : "hover:bg-nb-black/5 hover:border-nb-black/20"
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={3} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t-[3px] border-nb-black">
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 p-4 font-black uppercase tracking-tight text-nb-coral hover:bg-nb-coral/10 hover:border-[3px] hover:border-nb-coral hover:shadow-[3px_3px_0_var(--nb-coral)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <LogOut className="w-6 h-6" strokeWidth={3} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Search Modal */}
      <NbModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Start a new chat"
      >
        <UserSearch 
          onSelect={() => {
            setIsSearchModalOpen(false);
            onClose(); // Close sidebar on mobile too
          }}
        />
      </NbModal>
    </>
  );
};
