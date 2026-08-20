'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChats, fetchBotChat } from '@/lib/chat';
import { fetchPendingRequests } from '@/lib/friends';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getChatDisplayInfo, getInitials } from '@/lib/chatHelpers';
import { Bot, LogOut, Users } from 'lucide-react';
import clsx from 'clsx';
import { FriendsPanel } from './FriendsPanel';

export const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, setChats, activeChat, setActiveChat } = useChatStore();
  const [showFriends, setShowFriends] = useState(false);

  const { data } = useQuery({ queryKey: ['chats'], queryFn: fetchChats });
  const { data: botChat } = useQuery({ queryKey: ['botChat'], queryFn: fetchBotChat });
  const { data: pending = [] } = useQuery({ queryKey: ['pendingRequests'], queryFn: fetchPendingRequests });

  useEffect(() => {
    if (data) setChats(data);
  }, [data]);

  if (!user) return null;

  return (
    <div className="w-80 border-r border-neutral-800 flex flex-col h-full bg-neutral-950 relative">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFriends(true)}
            className="relative text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800"
          >
            <Users className="w-4 h-4" />
            {pending.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 rounded-full text-[10px] flex items-center justify-center text-white">
                {pending.length}
              </span>
            )}
          </button>
          <button onClick={logout} className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {botChat && (
        <button
          onClick={() => setActiveChat(botChat)}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 border-b border-neutral-800 hover:bg-neutral-900 transition-colors text-left',
            activeChat?.id === botChat.id && 'bg-neutral-900'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">PennBot</p>
            <p className="text-xs text-neutral-500">AI Assistant</p>
          </div>
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        {chats.filter((c) => c.id !== botChat?.id).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-600 gap-2 px-6 text-center">
            <Users className="w-8 h-8" />
            <p className="text-sm">No chats yet. Add friends to start messaging!</p>
          </div>
        ) : (
          chats.filter((c) => c.id !== botChat?.id).map((chat) => {
            const info = getChatDisplayInfo(chat, user.id);
            const lastMessage = chat.messages[0];

            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900 transition-colors text-left',
                  activeChat?.id === chat.id && 'bg-neutral-900'
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white">
                    {getInitials(info.name)}
                  </div>
                  {info.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{info.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {lastMessage?.content ?? 'No messages yet'}
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