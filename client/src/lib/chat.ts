import { api } from '@/lib/api';
import type { Chat, Message } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const fetchChats = async () => {
  const res = await api.get<ApiEnvelope<Chat[]>>('/chats');
  return res.data.data;
};

export const fetchBotChat = async () => {
  const res = await api.get<ApiEnvelope<Chat>>('/chats/bot');
  return res.data.data;
};

export const fetchChatMessages = async (chatId: string) => {
  const res = await api.get<ApiEnvelope<Message[]>>(`/messages/${chatId}`);
  return res.data.data;
};

export const createChat = async (memberId: string) => {
  const res = await api.post<ApiEnvelope<Chat>>('/chats', { memberIds: [memberId] });
  return res.data.data;
};