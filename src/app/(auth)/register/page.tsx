'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { NbButton } from '@/components/ui/NbButton';
import { NbInput } from '@/components/ui/NbInput';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();

  useEffect(() => {
    const prefillUsername = searchParams.get('username');
    if (prefillUsername) {
      setUsername(prefillUsername);
      setDisplayName(prefillUsername);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(email, password, displayName || username);
      router.push('/chats');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-nb-cream flex flex-col items-center justify-center p-4 py-8">
      
      {/* Same dashed circle logo */}
      <div className="mx-auto w-12 h-12 bg-nb-black rounded-full flex items-center justify-center mb-8 relative shrink-0">
        <div className="absolute inset-0 rounded-full shadow-[4px_4px_0px_var(--nb-coral)] -z-10" />
        <div className="w-8 h-8 rounded-full border-[2px] border-dashed border-white"></div>
      </div>

      <div className="w-full max-w-[380px]">
        {/* Main Card - Coral border and black shadow */}
        <div className="bg-white border-[3px] border-nb-coral shadow-[5px_5px_0px_#0D0D0D] p-8 sm:p-10 flex flex-col">
          <h1 className="font-black text-[22px] uppercase tracking-[0.1em] text-nb-black mb-6 text-center">
            Create New Account
          </h1>

          {error && (
            <div className="mb-4 p-2 border-2 border-nb-coral bg-nb-coral/10 text-nb-coral text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <label className="text-sm font-bold uppercase tracking-wide text-nb-black">Display Name</label>
              <NbInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold uppercase tracking-wide text-nb-black">Email</label>
              <NbInput 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" 
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

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold uppercase tracking-wide text-nb-black">Confirm</label>
              {/* Highlighted with coral border when active (focus ring overrides) */}
              <NbInput 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password" 
                required 
                className="focus:border-nb-coral focus:ring-nb-coral"
              />
            </div>

            <NbButton type="submit" variant="primary" className="mt-4 w-full">
              Sign Up
            </NbButton>
          </form>
        </div>
      </div>

      <div className="mt-10 text-center">
        <span className="font-bold text-nb-black/70 mr-2">Already have an account?</span>
        <Link 
          href="/login" 
          className="font-black uppercase text-nb-black underline decoration-[3px] underline-offset-4 hover:bg-nb-yellow transition-colors"
        >
          Log In
        </Link>
      </div>

    </div>
  );
}
