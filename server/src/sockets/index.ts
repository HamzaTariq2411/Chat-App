import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '@/config/env';
import { socketAuthMiddleware, AuthenticatedSocket } from '@/sockets/socketAuth';
import { registerChatHandlers } from '@/sockets/chat.socket';

export const initSocket = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('🔌 Connected:', socket.id, 'userId:', socket.userId);

    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
    });
  });

  return io;
};