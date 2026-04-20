'use client';

import { NbButton } from "@/components/ui/NbButton";
import { NbInput } from "@/components/ui/NbInput";
import { NbCard } from "@/components/ui/NbCard";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");


  const handleStartChatting = () => {
    if (username.trim()) {
      // Redirect to register with pre-filled username
      router.push(`/register?username=${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-nb-yellow min-h-screen">
      <NbCard className="w-full max-w-md p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl uppercase tracking-tight text-center font-black">CONVO</h1>
          <p className="text-center text-sm font-bold uppercase tracking-wider text-nb-black/60">
            A fun innovation
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <NbInput 
            placeholder="Enter your username..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <NbButton variant="primary" onClick={handleStartChatting} disabled={!username.trim()}>
            Start Chatting
          </NbButton>
          <div className="flex flex-col gap-4">
            <NbButton variant="ghost" className="w-full" onClick={() => router.push("/login")}>
              Sign In
            </NbButton>
          </div>
        </div>
      </NbCard>
    </main>
  );
}
