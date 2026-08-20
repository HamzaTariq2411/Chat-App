'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChats, fetchBotChat } from '@/lib/chat';
import { fetchPendingRequests } from '@/lib/friends';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getChatDisplayInfo, getInitials } from '@/lib/chatHelpers';
import { Bot, LogOut, Users, Search } from 'lucide-react';
import clsx from 'clsx';
import { FriendsPanel } from './FriendsPanel';
import { Logo } from '@/components/ui/Logo';

const SidebarSkeleton = () => (
  <div className="px-3 py-2 space-y-1">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-neutral-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-neutral-800 rounded w-2/3" />
          <div className="h-2.5 bg-neutral-800 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, setChats, activeChat, setActiveChat, typingByChat } = useChatStore();
  const [showFriends, setShowFriends] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading: chatsLoading } = useQuery({ queryKey: ['chats'], queryFn: fetchChats });
  const { data: botChat } = useQuery({ queryKey: ['botChat'], queryFn: fetchBotChat });
  const { data: pending = [] } = useQuery({ queryKey: ['pendingRequests'], queryFn: fetchPendingRequests });

  useEffect(() => {
    if (data) setChats(data);
  }, [data]);

  const otherChats = useMemo(() => {
    const base = chats.filter((c) => c.id !== botChat?.id);
    if (!search.trim() || !user) return base;
    return base.filter((c) =>
      getChatDisplayInfo(c, user.id).name.toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, botChat, search, user]);

  if (!user) return null;

  return (
    <div className="w-80 border-r border-neutral-800/80 flex flex-col h-full bg-neutral-950/40 relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFriends(true)}
              className="relative text-neutral-500 hover:text-white p-2 rounded-lg hover:bg-neutral-800/80 transition-colors"
            >
              <Users className="w-4 h-4" />
              {pending.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[10px] font-semibold flex items-center justify-center text-white ring-2 ring-neutral-950">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="text-neutral-500 hover:text-red-400 p-2 rounded-lg hover:bg-neutral-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-neutral-500 truncate">@{user.username}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>
      </div>

      {/* Bot pinned */}
      {botChat && (
        <button
          onClick={() => setActiveChat(botChat)}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 border-b border-neutral-800/80 hover:bg-neutral-900/60 transition-colors text-left',
            activeChat?.id === botChat.id && 'bg-neutral-900/80'
          )}
        >
          <div className="w-11 h-11 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-950/40">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-white">PennBot</p>
              <span className="text-[9px] uppercase tracking-wide bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold">AI</span>
            </div>
            <p className="text-xs text-neutral-500">Always here to help</p>
          </div>
        </button>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatsLoading ? (
          <SidebarSkeleton />
        ) : otherChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-600 gap-3 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm">
              {search ? 'No chats match your search' : 'No chats yet — add friends to start messaging'}
            </p>
          </div>
        ) : (
          otherChats.map((chat) => {
            const info = getChatDisplayInfo(chat, user.id);
            const lastMessage = chat.messages[0];
            const isTyping = (typingByChat[chat.id]?.size ?? 0) > 0;

            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/50 transition-colors text-left relative',
                  activeChat?.id === chat.id &&
                    'bg-neutral-900/80 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.75 before:rounded-full before:bg-indigo-500'
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold text-white">
                    {getInitials(info.name)}
                  </div>
                  {info.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-neutral-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{info.name}</p>
                  <p className={clsx('text-xs truncate mt-0.5', isTyping ? 'text-indigo-400 italic' : 'text-neutral-500')}>
                    {isTyping ? 'typing...' : lastMessage?.content ?? 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}
    </div>
  );
};