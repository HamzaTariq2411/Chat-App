import { api } from '@/lib/api';
import type { User } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SearchResult extends User {
  friendshipStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  isRequester: boolean;
}

export interface FriendRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  requester?: User;
  recipient?: User;
}

export const searchUsers = async (query: string) => {
  const res = await api.get<ApiEnvelope<SearchResult[]>>(`/friends/search?q=${encodeURIComponent(query)}`);
  return res.data.data;
};

export const fetchFriends = async () => {
  const res = await api.get<ApiEnvelope<User[]>>('/friends');
  return res.data.data;
};

export const fetchPendingRequests = async () => {
  const res = await api.get<ApiEnvelope<FriendRequest[]>>('/friends/requests/pending');
  return res.data.data;
};

export const fetchSentRequests = async () => {
  const res = await api.get<ApiEnvelope<FriendRequest[]>>('/friends/requests/sent');
  return res.data.data;
};

export const sendFriendRequest = async (recipientId: string) => {
  const res = await api.post<ApiEnvelope<FriendRequest>>('/friends/requests', { recipientId });
  return res.data.data;
};

export const respondToFriendRequest = async (friendshipId: string, action: 'ACCEPT' | 'REJECT') => {
  const res = await api.patch<ApiEnvelope<FriendRequest>>(`/friends/requests/${friendshipId}`, { action });
  return res.data.data;
};