'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Message } from '@/types';

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const { addMessage, setUserTyping, setUserOnline } = useChatStore();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('message:new', (message: Message) => {
      addMessage(message);
    });

    socket.on('typing:start', ({ userId }: { userId: string }) => setUserTyping(userId, true));
    socket.on('typing:stop', ({ userId }: { userId: string }) => setUserTyping(userId, false));

    socket.on('bot:typing', () => setUserTyping('bot', true));
    socket.on('bot:stopTyping', () => setUserTyping('bot', false));

    socket.on('user:online', ({ userId }: { userId: string }) => setUserOnline(userId, true));
    socket.on('user:offline', ({ userId }: { userId: string }) => setUserOnline(userId, false));

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
      socket.off('bot:typing');
      socket.off('bot:stopTyping');
      socket.off('user:online');
      socket.off('user:offline');
    };
  }, [token]);

  const joinChat = (chatId: string) => socketRef.current?.emit('chat:join', chatId);
  const leaveChat = (chatId: string) => socketRef.current?.emit('chat:leave', chatId);

  const sendMessage = (chatId: string, content: string) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('message:send', { chatId, content }, (res: any) => {
        res.success ? resolve(res.message) : reject(new Error(res.message));
      });
    });
  };

  const startTyping = (chatId: string) => socketRef.current?.emit('typing:start', { chatId });
  const stopTyping = (chatId: string) => socketRef.current?.emit('typing:stop', { chatId });

  return { joinChat, leaveChat, sendMessage, startTyping, stopTyping };
};