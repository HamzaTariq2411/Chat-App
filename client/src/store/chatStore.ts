import { create } from 'zustand';
import type { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  typingUsers: Set<string>;
  typingByChat: Record<string, Set<string>>;
  isSocketConnected: boolean;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (message: Message) => void;
  reconcileMessage: (tempId: string, realMessage: Message) => void;
  markMessageFailed: (tempId: string) => void;
  removeMessage: (id: string) => void;
  setUserTyping: (userId: string, isTyping: boolean) => void;
  setChatTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setSocketConnected: (connected: boolean) => void;
}

const patchMemberOnline = (chat: Chat, userId: string, isOnline: boolean): Chat => ({
  ...chat,
  members: chat.members.map((m) => (m.userId === userId ? { ...m, user: { ...m.user, isOnline } } : m)),
});

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  typingUsers: new Set(),
  typingByChat: {},
  isSocketConnected: false,

  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
  set((state) => {
    if (state.messages.some((m) => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),

addOptimisticMessage: (message) =>
  set((state) => {
    if (state.messages.some((m) => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),

 reconcileMessage: (tempId, realMessage) =>
  set((state) => {
    const alreadyDelivered = state.messages.some((m) => m.id === realMessage.id && m.id !== tempId);

    if (alreadyDelivered) {
      return { messages: state.messages.filter((m) => m.id !== tempId) };
    }

    return {
      messages: state.messages.map((m) => (m.id === tempId ? realMessage : m)),
    };
  }),

  markMessageFailed: (tempId) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === tempId ? { ...m, failed: true } : m)),
    })),

  removeMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),

  setUserTyping: (userId, isTyping) =>
    set((state) => {
      const next = new Set(state.typingUsers);
      isTyping ? next.add(userId) : next.delete(userId);
      return { typingUsers: next };
    }),

  setChatTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingByChat[chatId] ?? []);
      isTyping ? current.add(userId) : current.delete(userId);
      return { typingByChat: { ...state.typingByChat, [chatId]: current } };
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      chats: state.chats.map((chat) => patchMemberOnline(chat, userId, isOnline)),
      activeChat: state.activeChat ? patchMemberOnline(state.activeChat, userId, isOnline) : state.activeChat,
    })),

  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
}));