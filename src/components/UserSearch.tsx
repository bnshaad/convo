'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserStore } from '@/store/useUserStore';
import { UserProfile } from '@/types/user';
import { useChatStore } from '@/store/useChatStore';
import { NbCard } from '@/components/ui/NbCard';
import { NbButton } from '@/components/ui/NbButton';
import { Search as SearchIcon, User, MessageCircle, RefreshCw } from 'lucide-react';

interface UserSearchProps {
  onSelect?: (userId: string) => void;
  className?: string;
}

export const UserSearch = ({ onSelect, className = '' }: UserSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const { searchUsers, error: userError, isLoading, clearError } = useUserStore();
  const { startConversation, errorByScope, clearChatError, isCreatingChat } = useChatStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const foundUsers = await searchUsers(query);
        setResults(foundUsers);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, searchUsers]);

  const handleUserClick = async (user: UserProfile) => {
    try {
      const conversationId = await startConversation(user.id, user.name);
      
      if (onSelect) {
        onSelect(user.id);
      }
      
      router.push(`/chats/${conversationId}`);
    } catch {}
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-nb-black group-focus-within:text-nb-blue transition-colors">
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <SearchIcon className="w-5 h-5" strokeWidth={3} />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name..."
          className="w-full bg-white border-[3px] border-nb-black p-4 pl-12 text-lg font-bold text-nb-black focus:outline-none focus:bg-nb-yellow/5 placeholder:text-nb-black/30 shadow-[4px_4px_0px_#0D0D0D] focus:shadow-[6px_6px_0px_#0D0D0D] transition-all"
          style={{ borderRadius: 0 }}
        />
      </div>

      {(userError || errorByScope.chats) && (
        <div className="bg-nb-coral/15 border-[3px] border-nb-coral p-4 flex items-center justify-between gap-3">
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

      {/* Results List */}
      <div className="flex flex-col gap-3">
        {results.length > 0 ? (
          results.map((user) => (
            <NbCard 
              key={user.id} 
              className="p-4 flex items-center gap-4 border-[3px] border-nb-black shadow-[4px_4px_0px_#0D0D0D] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0D0D0D] transition-all cursor-pointer bg-white"
              onClick={() => handleUserClick(user)}
            >
              <div className="w-12 h-12 border-2 border-nb-black bg-nb-blue flex items-center justify-center overflow-hidden shrink-0 relative">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg leading-tight truncate">{user.name}</p>
                {user.status && (
                  <p className="font-bold text-sm text-nb-black/60 truncate">{user.status}</p>
                )}
              </div>
              <NbButton
                variant="primary"
                className="shrink-0"
                disabled={isCreatingChat}
              >
                <MessageCircle className="w-4 h-4" strokeWidth={3} />
              </NbButton>
            </NbCard>
          ))
        ) : query.trim() && !isLoading ? (
          <div className="p-8 text-center border-[3px] border-nb-black border-dashed opacity-50">
            <p className="font-bold uppercase tracking-widest text-sm">No users found</p>
          </div>
        ) : !query.trim() ? (
          <div className="p-8 text-center opacity-30 select-none">
            <p className="font-medium">{isCreatingChat ? 'Creating chat...' : 'Type to search for people to chat with'}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
