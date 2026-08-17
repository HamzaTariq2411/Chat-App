import express from 'express';
import cors from 'cors';
import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import authRoutes from '@/routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import { Request, Response } from 'express';

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is healthy 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;