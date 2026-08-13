import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from '@/config/env';

export const initSocket = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 New socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io;
};