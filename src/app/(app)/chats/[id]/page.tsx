'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Send } from 'lucide-react';
import { NbInput } from '@/components/ui/NbInput';
import { NbSkeleton } from '@/components/ui/NbSkeleton';
import { cn } from '@/lib/nb';

export default function SingleChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;
  const router = useRouter();
  
  const { conversations, messages, sendMessage, markRead } = useChatStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUserId = user?.id || 'me'; 
  
  const conversation = conversations.find(c => c.id === chatId);
  const chatMessages = messages[chatId] || [];
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [chatMessages, isLoading]);

  useEffect(() => {
    const unreadMessages = chatMessages.filter(m => !m.read && m.senderId !== currentUserId);
    unreadMessages.forEach(m => markRead(chatId, m.id));
  }, [chatMessages, chatId, currentUserId, markRead]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    sendMessage(chatId, {
      text: inputText,
      senderId: currentUserId,
    });
    
    setInputText('');
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (!conversation && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-nb-cream items-center justify-center p-4">
        <h2 className="font-black text-2xl uppercase mb-4">Chat Not Found</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-nb-cream text-nb-black">
      
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-[#2563FF] border-b-[3px] border-nb-black px-4 py-4 flex items-center z-30 md:relative md:static">
        <button
          onClick={() => router.back()}
          className="absolute left-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border-2 border-white/30 transition-all active:scale-90 md:left-auto md:relative md:mr-4"
        >
          <ArrowLeft className="text-white w-7 h-7" strokeWidth={3} />
        </button>
        
        <div className="w-full text-center pl-10 pr-10">
          {isLoading ? (
            <NbSkeleton className="h-6 w-48 mx-auto bg-white/20 border-white/10" />
          ) : (
            <h1 className="font-black text-[18px] text-white uppercase tracking-wide truncate">
              {conversation?.name}
            </h1>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 pt-20 md:pt-6 pb-36 md:pb-24 flex flex-col gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn("flex flex-col w-full max-w-[85%]", i % 2 === 0 ? "items-start" : "items-end ml-auto")}>
              <NbSkeleton className="h-16 w-full mb-2" />
              <NbSkeleton className="h-3 w-20" />
            </div>
          ))
        ) : chatMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-bold text-nb-black/50 uppercase tracking-widest text-sm bg-black/5 px-4 py-2 border-2 border-nb-black/10">No messages yet</span>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            
            if (isMe) {
              return (
                <div key={msg.id} className="flex flex-col items-end w-full">
                  <div className="flex gap-2 items-start justify-end w-full max-w-[85%]">
                    <div className="bg-nb-coral text-nb-black border-[3px] border-nb-black px-5 py-3 shadow-[4px_4px_0px_var(--nb-black)]">
                      <p className="font-bold text-[16px] leading-snug break-words">{msg.text}</p>
                    </div>
                    {/* Square dashed-border avatar right */}
                    <div className="shrink-0 mt-[10px]">
                      <div className="w-[22px] h-[22px] bg-white border-[1.5px] border-nb-black border-dashed flex items-center justify-center p-[2px]">
                         <div className="w-full h-full bg-nb-black" />
                      </div>
                    </div>
                  </div>
                  {/* Timestamp below */}
                  <span className="text-[11px] font-black text-nb-black/60 uppercase tracking-wider mt-2 mr-9">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex flex-col items-start w-full">
                  <div className="flex flex-col items-start w-full max-w-[85%]">
                    {/* Contact name label above */}
                    <span className="font-black text-[12px] uppercase tracking-widest text-nb-black mb-1.5 ml-1">
                      {conversation?.name}
                    </span>
                    <div className="bg-[#2563FF] text-white border-[3px] border-nb-black px-5 py-3 shadow-[-4px_4px_0px_var(--nb-black)]">
                      <p className="font-bold text-[16px] leading-snug break-words">{msg.text}</p>
                    </div>
                  </div>
                  {/* Timestamp below */}
                  <span className="text-[11px] font-black text-nb-black/60 uppercase tracking-wider mt-2 ml-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            }
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* Input Form Fixed Bottom (Above Nav if any) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-nb-black p-4 z-30 md:relative md:static md:border-t-0 md:mt-auto">
        <form onSubmit={handleSend} className="flex items-center gap-3 max-w-screen-md mx-auto">
          <div className="flex-1">
            <NbInput
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="w-full !border-[3px] !border-nb-black text-[16px] font-bold py-4 focus:!ring-nb-coral"
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="shrink-0 bg-nb-coral border-[3px] border-nb-black text-white w-14 h-14 flex items-center justify-center transition-all shadow-[4px_4px_0px_var(--nb-black)] hover:shadow-[6px_6px_0px_var(--nb-black)] hover:-translate-y-[2px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            <Send className="w-6 h-6" strokeWidth={3} />
          </button>
        </form>
      </footer>
    </div>
  );
}
