import { Request, Response, NextFunction } from 'express';
import { createMessage, getChatMessages } from '@/services/message.service';
import { success } from '@/utils/apiResponse';

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await createMessage(req.user!.id, req.body);
    res.status(201).json(success(message, 'Message sent'));
  } catch (err) {
    next(err);
  }
};

export const listMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const messages = await getChatMessages(req.params.chatId, req.user!.id, cursor);
    res.status(200).json(success(messages, 'Messages fetched'));
  } catch (err) {
    next(err);
  }
};