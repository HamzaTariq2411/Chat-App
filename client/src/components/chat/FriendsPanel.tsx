'use client';

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  searchUsers,
  fetchFriends,
  fetchPendingRequests,
  fetchSentRequests,
  sendFriendRequest,
  respondToFriendRequest,
} from '@/lib/friends';
import { getInitials } from '@/lib/chatHelpers';
import { Search, UserPlus, Check, X, Clock, Users } from 'lucide-react';
import clsx from 'clsx';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { createChat } from '@/lib/chat';
import { useChatStore } from '@/store/chatStore';

type Tab = 'friends' | 'requests' | 'add';

export const FriendsPanel = ({ onClose }: { onClose: () => void }) => {
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const queryClient = useQueryClient();
  const setActiveChat = useChatStore((s) => s.setActiveChat);

const startChatMutation = useMutation({
  mutationFn: createChat,
  onSuccess: (chat) => {
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    setActiveChat(chat);
    onClose();
  },
});

  const { data: friends = [] } = useQuery({ queryKey: ['friends'], queryFn: fetchFriends });
  const { data: pending = [] } = useQuery({ queryKey: ['pendingRequests'], queryFn: fetchPendingRequests });
  const { data: sent = [] } = useQuery({ queryKey: ['sentRequests'], queryFn: fetchSentRequests });
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['userSearch', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSearch'] });
      queryClient.invalidateQueries({ queryKey: ['sentRequests'] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ACCEPT' | 'REJECT' }) =>
      respondToFriendRequest(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  return (
    <div className="absolute inset-0 z-20 bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-5 shrink-0">
        <h2 className="text-white font-medium">Friends</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {[
          { key: 'friends' as Tab, label: 'Friends', count: friends.length },
          { key: 'requests' as Tab, label: 'Requests', count: pending.length },
          { key: 'add' as Tab, label: 'Add Friend', count: 0 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 py-3 text-sm font-medium relative transition-colors',
              tab === t.key ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
            {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ---- Friends tab ---- */}
        {tab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <EmptyState icon={<Users className="w-8 h-8" />} text="No friends yet. Add some!" />
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-900">
    <div className="relative">
      <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white">
        {getInitials(friend.name)}
      </div>
      {friend.isOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white">{friend.name}</p>
      <p className="text-xs text-neutral-500">{friend.isOnline ? 'Online' : 'Offline'}</p>
    </div>
    <button
      onClick={() => startChatMutation.mutate(friend.id)}
      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full font-medium"
    >
      Message
    </button>
  </div>
              ))
            )}
          </div>
        )}

        {/* ---- Requests tab ---- */}
        {tab === 'requests' && (
          <div>
            {pending.length === 0 && sent.length === 0 ? (
              <EmptyState icon={<Clock className="w-8 h-8" />} text="No pending requests" />
            ) : (
              <>
                {pending.length > 0 && (
                  <div className="px-5 pt-4 pb-1 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Incoming
                  </div>
                )}
                {pending.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-900">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {getInitials(req.requester!.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{req.requester!.name}</p>
                      <p className="text-xs text-neutral-500">wants to be friends</p>
                    </div>
                    <button
                      onClick={() => respondMutation.mutate({ id: req.id, action: 'ACCEPT' })}
                      className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shrink-0"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => respondMutation.mutate({ id: req.id, action: 'REJECT' })}
                      className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center shrink-0"
                    >
                      <X className="w-4 h-4 text-neutral-300" />
                    </button>
                  </div>
                ))}

                {sent.length > 0 && (
                  <div className="px-5 pt-4 pb-1 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Sent
                  </div>
                )}
                {sent.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {getInitials(req.recipient!.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{req.recipient!.name}</p>
                      <p className="text-xs text-neutral-500">Request pending</p>
                    </div>
                    <Clock className="w-4 h-4 text-neutral-600 shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ---- Add Friend tab ---- */}
        {tab === 'add' && (
          <div>
            <div className="p-4 sticky top-0 bg-neutral-950 border-b border-neutral-800">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isSearching && <p className="text-center text-sm text-neutral-500 py-6">Searching...</p>}

            {!isSearching && debouncedQuery.trim().length >= 2 && searchResults.length === 0 && (
              <EmptyState icon={<Search className="w-8 h-8" />} text="No users found" />
            )}

            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-900">
                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>

                {user.friendshipStatus === 'ACCEPTED' && (
                  <span className="text-xs text-emerald-400 shrink-0">Friends</span>
                )}
                {user.friendshipStatus === 'PENDING' && (
                  <span className="text-xs text-neutral-500 shrink-0">
                    {user.isRequester ? 'Requested' : 'Respond in Requests'}
                  </span>
                )}
                {(!user.friendshipStatus || user.friendshipStatus === 'REJECTED') && (
                  <button
                    onClick={() => sendMutation.mutate(user.id)}
                    disabled={sendMutation.isPending}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-neutral-600 gap-2">
    {icon}
    <p className="text-sm">{text}</p>
  </div>
);