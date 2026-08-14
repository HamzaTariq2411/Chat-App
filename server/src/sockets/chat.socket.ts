import { Server } from 'socket.io';
import prisma from '@/config/db';
import { AuthenticatedSocket } from '@/sockets/socketAuth';
import { createMessage } from '@/services/message.service';
import { generateBotReply } from '@/services/bot.service';

// Maps userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map<string, Set<string>>();

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId!;

  // ---- Presence: mark online ----
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socket.id);

  prisma.user.update({ where: { id: userId }, data: { isOnline: true } }).catch(() => {});
  io.emit('user:online', { userId });

  // ---- Join a chat room ----
  socket.on('chat:join', async (chatId: string) => {
    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) return; // silently ignore unauthorized join attempts
    socket.join(chatId);
  });

  socket.on('chat:leave', (chatId: string) => {
    socket.leave(chatId);
  });

  // ---- Send a message ----
  socket.on(
    'message:send',
    async (payload: { chatId: string; content: string }, ack?: (res: unknown) => void) => {
      try {
        const message = await createMessage(userId, payload);

        // broadcast to everyone in the room (including sender, for multi-device sync)
        io.to(payload.chatId).emit('message:new', message);

        ack?.({ success: true, message });

        // ---- Bot auto-reply if bot is a member of this chat ----
        const botMembership = await prisma.chatMember.findFirst({
          where: { chatId: payload.chatId, user: { isBot: true } },
          include: { user: true },
        });

        if (botMembership) {
          io.to(payload.chatId).emit('bot:typing', { chatId: payload.chatId });

          const botReplyContent = await generateBotReply(payload.chatId, payload.content);

          const botMessage = await createMessage(
            botMembership.userId,
            { chatId: payload.chatId, content: botReplyContent },
            'BOT'
          );

          io.to(payload.chatId).emit('bot:stopTyping', { chatId: payload.chatId });
          io.to(payload.chatId).emit('message:new', botMessage);
        }
      } catch (err: any) {
        ack?.({ success: false, message: err.message ?? 'Failed to send message' });
      }
    }
  );

  // ---- Typing indicators (human users) ----
  socket.on('typing:start', ({ chatId }: { chatId: string }) => {
    socket.to(chatId).emit('typing:start', { chatId, userId });
  });

  socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
    socket.to(chatId).emit('typing:stop', { chatId, userId });
  });

  // ---- Disconnect: mark offline only if no other sockets remain for this user ----
  socket.on('disconnect', async () => {
    const sockets = onlineUsers.get(userId);
    sockets?.delete(socket.id);

    if (!sockets || sockets.size === 0) {
      onlineUsers.delete(userId);
      await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeen: new Date() } }).catch(() => {});
      io.emit('user:offline', { userId });
    }
  });
};