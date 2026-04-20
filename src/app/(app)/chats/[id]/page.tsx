'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { NbInput } from '@/components/ui/NbInput';
import { NbSkeleton } from '@/components/ui/NbSkeleton';
import { cn } from '@/lib/nb';

export default function SingleChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;
  const router = useRouter();
  
  const { 
    conversations, 
    messages, 
    sendMessage, 
    markRead, 
    subscribeToMessages, 
    setActiveConversation,
    subscribeToTypingIndicators,
    typingIndicators,
    setTyping
  } = useChatStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUserId = user?.id || ''; 
  
  const conversation = conversations.find(c => c.id === chatId);
  const chatMessages = messages[chatId] || [];
  const activeTyping = typingIndicators[chatId] || [];
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Subscribe to messages, typing indicators and set active conversation
  useEffect(() => {
    if (!chatId) return;
    
    setActiveConversation(chatId);
    const unsubMessages = subscribeToMessages(chatId);
    const unsubTyping = subscribeToTypingIndicators(chatId);
    
    return () => {
      unsubMessages();
      unsubTyping();
      setActiveConversation(null);
    };
  }, [chatId, subscribeToMessages, setActiveConversation, subscribeToTypingIndicators]);

  // Handle typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (chatId) {
      setTyping(chatId, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(chatId, false);
      }, 3000);
    }
  };

  useEffect(() => {
    // Artificial delay to wait for initial messages to load
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Mark as read
  useEffect(() => {
    if (!chatId || chatMessages.length === 0) return;
    const hasUnread = chatMessages.some(m => !m.read && m.senderId !== currentUserId);
    if (hasUnread) {
      markRead(chatId);
    }
  }, [chatMessages, chatId, currentUserId, markRead]);

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
    
    const text = inputText.trim();
    setInputText('');
    
    // Stop typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(chatId, false);

    sendMessage(chatId, text);
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
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <div className="w-16 h-16 border-[3px] border-nb-black bg-white mb-4 flex items-center justify-center rotate-3">
               <Send className="w-8 h-8" />
            </div>
            <p className="font-black uppercase tracking-widest text-sm text-center">No messages yet<br/><span className="text-[10px] font-bold">Start the conversation!</span></p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {chatMessages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              const prevMsg = chatMessages[idx - 1];
              const msgDate = new Date(msg.createdAt).toLocaleDateString();
              const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toLocaleDateString() : null;
              const showDateDivider = msgDate !== prevMsgDate;
              
              return (
                <div key={msg.id} className="flex flex-col gap-6">
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="h-[2px] flex-1 bg-nb-black/10" />
                      <span className="px-4 py-1 border-2 border-nb-black/20 text-[10px] font-black uppercase tracking-[0.2em] bg-white/50 text-nb-black/60">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="h-[2px] flex-1 bg-nb-black/10" />
                    </div>
                  )}
                  <div className={cn("flex flex-col w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "items-end" : "items-start")}>
                    <div className={cn("flex gap-2 items-start w-full max-w-[85%]", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <div className="shrink-0 mt-[10px]">
                          <div className="w-[18px] h-[18px] border-[1.5px] border-nb-black bg-nb-blue shadow-[2px_2px_0_var(--nb-black)]" />
                        </div>
                      )}
                      <div className={cn(
                        "border-[3px] border-nb-black px-5 py-3 transition-transform",
                        isMe 
                          ? "bg-nb-coral text-nb-black shadow-[4px_4px_0_var(--nb-black)]" 
                          : "bg-[#2563FF] text-white shadow-[-4px_4px_0_var(--nb-black)]"
                      )}>
                        <p className="font-bold text-[16px] leading-snug break-words">{msg.text}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black text-nb-black/50 uppercase tracking-widest mt-2",
                      isMe ? "margin-right-[4px]" : "margin-left-[26px]"
                    )}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Typing Area */}
        {activeTyping.length > 0 && activeTyping[0] !== currentUserId && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-nb-black animate-bounce duration-700" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-nb-black animate-bounce duration-700" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 bg-nb-black animate-bounce duration-700" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">Someone is typing...</span>
          </div>
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
              onChange={handleInputChange}
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
