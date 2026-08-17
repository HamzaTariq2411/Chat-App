import { create } from 'zustand';
import type { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  typingUsers: Set<string>;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  typingUsers: new Set(),

  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      // avoid duplicates (e.g. sender receiving their own broadcast twice)
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),

  setUserTyping: (userId, isTyping) =>
    set((state) => {
      const next = new Set(state.typingUsers);
      isTyping ? next.add(userId) : next.delete(userId);
      return { typingUsers: next };
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      chats: state.chats.map((chat) => ({
        ...chat,
        members: chat.members.map((m) =>
          m.userId === userId ? { ...m, user: { ...m.user, isOnline } } : m
        ),
      })),
    })),
}));