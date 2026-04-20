'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import Link from 'next/link';

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  danger?: boolean;
}

function ToggleRow({ label, checked, onChange, danger }: ToggleRowProps) {
  return (
    <button
      type="button"
      className={`w-full flex items-center justify-between px-5 py-4 bg-nb-card border-b-[2px] border-nb-black last:border-b-0 text-left transition-colors ${danger ? 'hover:bg-nb-coral/10' : 'hover:bg-nb-cream/10'}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`font-bold text-[15px] uppercase tracking-wide ${danger ? 'text-nb-coral' : 'text-nb-black'}`}>
        {label}
      </span>

      {/* Custom Toggle Switch */}
      <div
        className={`relative w-[52px] h-[28px] border-[2px] border-nb-black shrink-0 transition-colors duration-200 ${
          checked ? 'bg-nb-yellow' : 'bg-nb-cream'
        }`}
      >
        <div
          className={`absolute top-[2px] w-[20px] h-[20px] border-[2px] border-nb-black transition-all duration-200 ${
            checked ? 'left-[26px] bg-nb-black' : 'left-[2px] bg-nb-cream'
          }`}
        />
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { 
    darkMode, setDarkMode,
    notifPush, setNotifPush,
    notifEmail, setNotifEmail,
    privacyOnline, setPrivacyOnline,
    privacyReceipts, setPrivacyReceipts,
    accessibility, setAccessibility,
    language, setLanguage,
    fontSize, setFontSize
  } = useSettingsStore();

  const [logoutToggle, setLogoutToggle] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Logout handle when toggle is activated
  useEffect(() => {
    if (logoutToggle) {
      const timer = setTimeout(() => {
        logout();
        router.push('/');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [logoutToggle, logout, router]);

  const handleSave = () => {
    // In this implementation, the store updates values immediately on toggle/change.
    // However, we show the "Saved!" banner to confirm the user's actions.
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-nb-cream text-nb-black relative pb-24">

      {/* Saved Confirmation Banner */}
      <div
        className={`fixed top-0 left-0 w-full z-[60] transition-transform duration-300 ${
          showSaved ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-nb-coral border-b-[3px] border-nb-black py-3 px-6 text-white font-black text-center uppercase tracking-widest text-[14px]">
          Settings Applied!
        </div>
      </div>

      {/* Header Banner */}
      <header className="bg-[#FF7A00] border-b-[3px] border-nb-black px-6 py-5 flex items-center justify-between shrink-0">
        <h1 className="text-white font-black text-[22px] uppercase tracking-wider">
          Settings
        </h1>
        <span className="text-white/80 font-bold text-[13px] tracking-wider">
          #FF7A00
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-8">

        {/* Toggle List Card */}
        <div className="w-full max-w-[420px] border-[2px] border-nb-black bg-nb-card shadow-[5px_5px_0px_var(--nb-black)] overflow-hidden">
          <ToggleRow label="Dark Mode" checked={darkMode} onChange={setDarkMode} />
          <ToggleRow label="Push Notifications" checked={notifPush} onChange={setNotifPush} />
          <ToggleRow label="Email Notifications" checked={notifEmail} onChange={setNotifEmail} />
          <ToggleRow label="Show Online Status" checked={privacyOnline} onChange={setPrivacyOnline} />
          <ToggleRow label="Read Receipts" checked={privacyReceipts} onChange={setPrivacyReceipts} />
          <ToggleRow label="Accessibility Mode" checked={accessibility} onChange={setAccessibility} />
          <ToggleRow label="Logout Session" checked={logoutToggle} onChange={setLogoutToggle} danger />
        </div>

        {/* Language & Font Size Card */}
        <div className="w-full max-w-[420px] border-[2px] border-nb-black bg-nb-card shadow-[5px_5px_0px_var(--nb-black)] p-5 flex flex-col gap-4">
          {/* Language */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[13px] uppercase tracking-wide text-nb-black">Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-nb-card border-[2px] border-nb-black py-3 px-4 font-bold text-[15px] appearance-none cursor-pointer outline-none focus:ring-0 text-nb-black"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="japanese">Japanese</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-nb-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[13px] uppercase tracking-wide text-nb-black">Font Size</label>
            <div className="relative">
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full bg-nb-card border-[2px] border-nb-black py-3 px-4 font-bold text-[15px] appearance-none cursor-pointer outline-none focus:ring-0 text-nb-black"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">Extra Large</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-nb-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Explicit Save Button UI */}
          <button
            onClick={handleSave}
            className="w-full bg-nb-coral border-[2px] border-nb-black shadow-[4px_4px_0px_var(--nb-black)] py-3.5 font-black text-[14px] uppercase tracking-wider text-white transition-all hover:shadow-[6px_6px_0px_var(--nb-black)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-1 active:translate-y-1 active:shadow-[0_0_0_#0D0D0D] mt-2"
          >
            Confirm Settings
          </button>
        </div>
      </main>
    </div>
  );
}
