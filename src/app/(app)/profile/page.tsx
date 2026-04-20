'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { NbInput } from '@/components/ui/NbInput';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [name, setName] = useState(user?.name || 'Your Name');
  
  const handleSave = () => {
    // In a real app we'd update the user store or backend
    alert('Changes saved!');
  };
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-nb-cream text-nb-black relative pb-24 items-center overflow-x-hidden">

      {/* Main Profile Card Wrapper */}
      <div className="w-full max-w-[420px] bg-nb-card border-l-[3px] border-r-[3px] border-nb-black min-h-[100dvh] flex flex-col relative shadow-[5px_0_0_var(--nb-black)]">
        
        {/* Header Band */}
        <header className="bg-[#7C3AED] border-b-[3px] border-nb-black py-5 w-full shrink-0 flex items-center justify-center">
          <h1 className="text-white font-black text-[20px] tracking-widest uppercase">
            Your Profile
          </h1>
        </header>

        {/* Content Body */}
        <main className="flex-1 flex flex-col items-center px-6 md:px-8 pt-10 pb-28">
          
          {/* Avatar Section */}
          <div className="relative mb-6">
            {/* Coral Accent Shadow Quarter-Circle */}
            <div className="absolute top-1.5 left-1.5 w-[85px] h-[85px] bg-nb-coral -z-10" />
            
            {/* Dashed Border Main Avatar */}
            <div className="w-[85px] h-[85px] bg-nb-card border-[2.5px] border-nb-black border-dashed flex items-center justify-center overflow-hidden z-10 relative">
               {/* Silhouette Icon */}
               <svg viewBox="0 0 24 24" className="w-[50px] h-[50px] mt-3" fill="currentColor">
                 <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 8.6 9 10.3 11 10.8V11C7 11.5 4 15 4 19V22H20V19C20 15 17 11.5 13 11V10.8C15 10.3 16.5 8.6 16.5 6.5C16.5 4 14.5 2 12 2Z" />
               </svg>
            </div>
          </div>

          {/* User Name */}
          <h2 className="font-black text-[28px] text-center w-full mb-8 tracking-tight">
            {name}
          </h2>

          {/* Form Fields */}
          <div className="w-full flex flex-col gap-5 mb-8">
             {/* Name Field - Coral shadow mapped matching image */}
             <div className="relative">
               <div className="absolute -inset-[2px] bg-nb-coral border-2 border-nb-black translate-x-1 translate-y-1 z-0 shadow-[2px_2px_0px_var(--nb-black)]" />
               <NbInput
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="relative z-10 w-full font-bold !border-2 !border-nb-black py-3 px-4 bg-nb-card"
                 placeholder="Enter your name"
               />
             </div>

             {/* Email Field - Plain Text Style reading from image or standard read-only input */}
             <div className="w-full text-nb-black border-2 border-transparent px-1 mt-1">
               <span className="font-bold text-[15px]">Email: {name.toLowerCase().replace(' ', '.')}@email.com</span>
             </div>

             {/* Password Field w/ dropdown simulated */}
             <div className="relative mt-1">
               <div className="absolute -inset-[2px] bg-nb-coral border-2 border-nb-black translate-x-1 translate-y-1 z-0 shadow-[2px_2px_0px_var(--nb-black)]" />
               <div className="relative z-10 w-full bg-nb-card border-2 border-nb-black flex items-center pr-3">
                 <input 
                   type="text" 
                   readOnly
                   value="Password"
                   className="w-full bg-transparent font-bold py-3 px-4 outline-none pointer-events-none" 
                 />
                 <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <path d="M6 9l6 6 6-6" />
                 </svg>
               </div>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3 mb-8">
            <button
              onClick={handleSave}
              className="flex-1 bg-nb-coral border-2 border-nb-black shadow-[4px_4px_0px_var(--nb-black)] py-3.5 px-2 font-black text-[13px] uppercase tracking-wide transition-all hover:shadow-[6px_6px_0px_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_var(--nb-black)] text-white truncate"
            >
              Save Changes
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-nb-blue border-2 border-nb-black shadow-[4px_4px_0px_var(--nb-black)] py-3.5 px-2 font-black text-[13px] uppercase tracking-wide text-white transition-all hover:shadow-[6px_6px_0px_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_var(--nb-black)] truncate"
            >
              Log Out
            </button>
          </div>

          {/* Thin Black Divider */}
          <div className="w-full border-t-[2.5px] border-nb-black" />
        </main>
      </div>
    </div>
  );
}
