'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { NbButton } from '@/components/ui/NbButton';
import { NbInput } from '@/components/ui/NbInput';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    try {
      await login(username, password);
      router.push('/chats');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-nb-cream flex flex-col items-center justify-center p-4">
      
      {/* Logo placed outside but near the top, or inside as per layout */}
      <div className="mx-auto w-12 h-12 bg-nb-black border-[3px] border-nb-black flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 shadow-[4px_4px_0px_var(--nb-coral)] -z-10" />
        <div className="w-8 h-8 border-[2px] border-dashed border-white"></div>
      </div>

      <div className="relative isolate w-full max-w-[380px]">
        {/* Coral offset border effect matching reference image */}
        <div className="absolute -inset-[4px] bg-nb-coral border-[3px] border-nb-black shadow-[5px_5px_0px_#0D0D0D] -z-10" />
        
        {/* Main Card */}
        <div className="bg-white border-[3px] border-nb-black p-10 flex flex-col">
          <h1 className="font-black text-[22px] uppercase tracking-[0.1em] text-nb-black mb-8 text-center">
            Login to Account
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold uppercase tracking-wide text-nb-black">Username</label>
              <NbInput 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username" 
                required 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold uppercase tracking-wide text-nb-black">Password</label>
              <NbInput 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                required 
              />
            </div>

            <NbButton type="submit" variant="primary" className="mt-2 w-full">
              Log In
            </NbButton>

            <div className="text-center mt-3">
              <a href="#" className="font-bold text-[13px] text-nb-black underline decoration-2 underline-offset-4 hover:bg-nb-yellow transition-colors">
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-12 text-center">
        <span className="font-bold text-nb-black/70 mr-2">Don't have an account?</span>
        <Link 
          href="/register" 
          className="font-black uppercase text-nb-black underline decoration-[3px] underline-offset-4 hover:bg-nb-yellow transition-colors"
        >
          Sign Up
        </Link>
      </div>

    </div>
  );
}
