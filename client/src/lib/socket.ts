import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};