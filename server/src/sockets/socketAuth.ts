import { Socket, ExtendedError } from 'socket.io';
import { verifyToken } from '@/utils/jwt';
import prisma from '@/config/db';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
};