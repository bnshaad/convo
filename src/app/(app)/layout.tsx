'use client';

import { ReactNode, useState } from 'react';
import { NbSidebar } from '@/components/layout/NbSidebar';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-nb-cream overflow-hidden">
      {/* Sidebar - Persistent on desktop, drawer on mobile */}
      <NbSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto overflow-x-hidden">
        
        {/* Mobile Header (Hamburger) */}
        <header className="md:hidden flex items-center px-4 py-4 bg-nb-yellow border-b-[3px] border-nb-black sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 h-12 flex items-center justify-center bg-white border-[3px] border-nb-black shadow-[3px_3px_0_var(--nb-black)] transition-all hover:shadow-[5px_5px_0_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Menu className="w-7 h-7" strokeWidth={3} />
          </button>
          <span className="ml-4 font-black text-xl uppercase tracking-tight">CONVO</span>
        </header>

        {children}
      </div>
    </div>
  );
}
