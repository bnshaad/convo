'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { Chat, Message } from '@/types/chat';
import { useUserStore } from '@/store/useUserStore';
import { UserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuthStore';
import { NbCard } from '@/components/ui/NbCard';
import { NbButton } from '@/components/ui/NbButton';
import { Search as SearchIcon, User, MessageSquare, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getChatDisplayName } from '@/lib/chat';

type FilterType = 'All' | 'Users' | 'People' | 'Messages';

export default function SearchPage() {
  const { chats, messagesByChatId, startConversation, errorByScope, clearChatError } = useChatStore();
  const { searchUsers, error: userError, isLoading: isUserStoreLoading, clearError } = useUserStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [foundUsers, setFoundUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Search for users in Firebase
  useEffect(() => {
    const doUserSearch = async () => {
      if (!debouncedQuery.trim()) {
        setFoundUsers([]);
        return;
      }

      setIsSearching(true);
      const users = await searchUsers(debouncedQuery);
      setFoundUsers(users);
      setIsSearching(false);
    };

    doUserSearch();
  }, [debouncedQuery, searchUsers]);

  const handleStartChat = async (targetUserId: string, targetUserName: string) => {
    if (!user?.id) return;

    try {
      const conversationId = await startConversation(targetUserId, targetUserName);
      router.push(`/chats/${conversationId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Search Logic for local data
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return { people: [], messages: [] };

    const q = debouncedQuery.toLowerCase();

    const filteredPeople = chats.filter((chat) =>
      getChatDisplayName(chat, user?.id).toLowerCase().includes(q)
    );

    const filteredMessages: { msg: Message; conv: Chat }[] = [];
    Object.entries(messagesByChatId).forEach(([convId, msgs]) => {
      const conv = chats.find(c => c.id === convId);
      if (conv) {
        msgs.forEach(m => {
          if (m.text.toLowerCase().includes(q)) {
            filteredMessages.push({ msg: m, conv });
          }
        });
      }
    });

    return {
      people: filteredPeople,
      messages: filteredMessages
    };
  }, [debouncedQuery, chats, messagesByChatId, user?.id]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-nb-yellow px-0.5">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-nb-cream flex flex-col relative pb-20 overflow-x-hidden">
      
      {/* Search Header */}
      <header className="bg-[#2563FF] p-6 pt-6 md:pt-8 shrink-0">
        <div className="relative max-w-2xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-black w-6 h-6" strokeWidth={3} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-white border-b-2 border-nb-black py-4 pl-14 pr-6 text-xl font-bold text-nb-black focus:outline-none placeholder:text-nb-black/40"
            style={{ borderRadius: 0 }}
          />
        </div>
      </header>

      {/* Filter Pills */}
      <div className="bg-nb-cream px-6 py-4 flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">
        {(['All', 'Users', 'People', 'Messages'] as FilterType[]).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 font-black uppercase text-sm tracking-widest transition-all duration-150 ${
                isActive
                ? 'bg-nb-yellow border-[2px] border-nb-black shadow-[2px_2px_0px_#0D0D0D]'
                : 'bg-white border-[2px] border-nb-black hover:bg-nb-yellow/30 hover:shadow-[3px_3px_0px_#0D0D0D] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              }`}
              style={{ borderRadius: 0 }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Results Section */}
      <main className="flex-1 px-6 py-4">
        {(userError || errorByScope.chats) && (
          <div className="max-w-2xl mx-auto mb-6 bg-nb-coral/15 border-[3px] border-nb-coral p-4 flex items-center justify-between gap-3">
            <p className="font-bold uppercase text-sm tracking-wide text-nb-coral">{userError || errorByScope.chats}</p>
            <button
              type="button"
              onClick={() => {
                clearChatError('chats');
                clearError();
              }}
              className="font-black uppercase text-xs underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {!debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-30 select-none">
            {/* Geometric Illustration */}
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" className="mb-6">
              <rect x="20" y="20" width="40" height="40" stroke="#0D0D0D" strokeWidth="4" />
              <rect x="40" y="40" width="40" height="40" stroke="#0D0D0D" strokeWidth="4" />
              <circle cx="70" cy="30" r="15" stroke="#0D0D0D" strokeWidth="4" />
              <line x1="80" y1="40" x2="90" y2="50" stroke="#0D0D0D" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="text-xl font-medium tracking-tight">Search for people or messages</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            
            {/* Global Users Section - Search for new people */}
            {(activeFilter === 'All' || activeFilter === 'Users') && foundUsers.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nb-black/60">Find Users</h3>
                <div className="flex flex-col gap-3">
                  {foundUsers.map(userProfile => (
                    <NbCard key={userProfile.id} className="p-4 flex items-center gap-4 border-[3px] border-nb-black shadow-[4px_4px_0px_#0D0D0D]">
                      <div className="w-12 h-12 border-2 border-nb-black bg-nb-blue flex items-center justify-center overflow-hidden shrink-0">
                        {userProfile.avatar ? (
                          <div className="relative w-full h-full">
                            <Image src={userProfile.avatar} alt={userProfile.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <User className="w-8 h-8 text-white" strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg leading-none mb-1">
                          {highlightText(userProfile.name, debouncedQuery)}
                        </p>
                        {userProfile.status && (
                          <p className="font-bold text-sm text-nb-black/60 truncate">
                            {userProfile.status}
                          </p>
                        )}
                      </div>
                      <NbButton
                        variant="primary"
                        onClick={() => handleStartChat(userProfile.id, userProfile.name)}
                        className="shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" strokeWidth={3} />
                      </NbButton>
                    </NbCard>
                  ))}
                </div>
              </div>
            )}

            {/* People Section - Existing conversations */}
            {(activeFilter === 'All' || activeFilter === 'People') && results.people.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nb-black/60">Your Conversations</h3>
                <div className="flex flex-col gap-3">
                  {results.people.map(person => (
                    <Link key={person.id} href={`/chats/${person.id}`}>
                      <NbCard className="p-4 flex items-center gap-4 border-[3px] border-nb-black shadow-[4px_4px_0px_#0D0D0D] cursor-pointer hover:translate-y-[-2px] transition-transform">
                        <div className="w-12 h-12 border-2 border-nb-black bg-white flex items-center justify-center overflow-hidden shrink-0">
                          <User className="w-8 h-8" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-lg leading-none mb-1">
                            {highlightText(getChatDisplayName(person, user?.id), debouncedQuery)}
                          </p>
                          <p className="font-bold text-sm text-nb-black/60 truncate">
                            {person.lastMessage}
                          </p>
                        </div>
                      </NbCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {(activeFilter === 'All' || activeFilter === 'Messages') && results.messages.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nb-black/60">Messages</h3>
                <div className="flex flex-col gap-3">
                  {results.messages.map(({ msg, conv }) => (
                    <NbCard key={msg.id} className="p-4 flex items-center gap-4 border-[3px] border-nb-black shadow-[4px_4px_0px_#0D0D0D]">
                      <div className="w-12 h-12 border-2 border-nb-black bg-nb-blue flex items-center justify-center shrink-0">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <p className="font-black text-sm uppercase tracking-wider">{getChatDisplayName(conv, user?.id)}</p>
                        </div>
                        <p className="font-bold text-md leading-snug">
                          {highlightText(msg.text, debouncedQuery)}
                        </p>
                      </div>
                    </NbCard>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearching && results.people.length === 0 && results.messages.length === 0 && foundUsers.length === 0 && (
              <div className="py-20 text-center">
                 <p className="font-bold text-nb-black/40 uppercase tracking-widest text-lg">No results found for &quot;{debouncedQuery}&quot;</p>
                 <p className="font-bold text-nb-black/30 uppercase tracking-widest text-sm mt-2">Try a different search term</p>
              </div>
            )}

            {/* Searching Indicator */}
            {(isSearching || isUserStoreLoading) && (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-nb-black border-t-transparent animate-spin"></div>
                <p className="font-bold text-nb-black/60 uppercase tracking-widest text-sm mt-4">Searching users...</p>
              </div>
            )}

          </div>
        )}
      </main>

    </div>
  );
}
