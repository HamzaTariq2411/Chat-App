import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { ApiError } from '@/utils/apiResponse';
import prisma from '@/config/db';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string; avatar: string | null };
    }
  }
}

export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, 'Not authorized, invalid or expired token'));
  }
};