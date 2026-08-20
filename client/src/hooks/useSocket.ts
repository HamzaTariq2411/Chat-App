'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getSocket } from '@/lib/socket';
import type { Message } from '@/types';

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const chats = useChatStore((s) => s.chats);
  const { addMessage, setUserTyping, setChatTyping, setUserOnline, setSocketConnected } = useChatStore();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  // Join every chat room the user is part of — not just the active one.
  // This is what lets typing/presence work from the sidebar, without opening a chat.
  const joinAllRooms = useCallback(() => {
    chats.forEach((chat) => socketRef.current?.emit('chat:join', chat.id));
  }, [chats]);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    if (socket.connected) {
      setSocketConnected(true);
      joinAllRooms();
    }

    socket.on('connect', () => {
      setSocketConnected(true);
      joinAllRooms();
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('message:new', (message: Message) => addMessage(message));

    socket.on('typing:start', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setUserTyping(userId, true);
      setChatTyping(chatId, userId, true);
    });
    socket.on('typing:stop', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setUserTyping(userId, false);
      setChatTyping(chatId, userId, false);
    });

    socket.on('bot:typing', ({ chatId }: { chatId: string }) => {
      setUserTyping('bot', true);
      setChatTyping(chatId, 'bot', true);
    });
    socket.on('bot:stopTyping', ({ chatId }: { chatId: string }) => {
      setUserTyping('bot', false);
      setChatTyping(chatId, 'bot', false);
    });

    socket.on('user:online', ({ userId }: { userId: string }) => setUserOnline(userId, true));
    socket.on('user:offline', ({ userId }: { userId: string }) => setUserOnline(userId, false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('bot:typing');
      socket.off('bot:stopTyping');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [token]);

  // Re-join rooms whenever the chat list changes (e.g. a new friend chat gets created)
  useEffect(() => {
    if (socketRef.current?.connected) joinAllRooms();
  }, [chats.length]);

  const joinChat = (chatId: string) => socketRef.current?.emit('chat:join', chatId);
  const leaveChat = (chatId: string) => socketRef.current?.emit('chat:leave', chatId);

  const waitForConnection = (timeoutMs = 4000): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) return resolve();
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), timeoutMs);
      socketRef.current?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  };

  const sendMessage = async (chatId: string, content: string) => {
    if (!socketRef.current?.connected) {
      await waitForConnection();
    }
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('message:send', { chatId, content }, (res: any) => {
        res?.success ? resolve(res.message) : reject(new Error(res?.message ?? 'Failed to send'));
      });
    });
  };

  const startTyping = (chatId: string) => socketRef.current?.emit('typing:start', { chatId });
  const stopTyping = (chatId: string) => socketRef.current?.emit('typing:stop', { chatId });

  return { joinChat, leaveChat, sendMessage, startTyping, stopTyping };
};