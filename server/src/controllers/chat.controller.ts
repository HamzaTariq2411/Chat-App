import { Request, Response, NextFunction } from 'express';
import { createOrGetChat, getUserChats, getChatById, getOrCreateBotChat } from '@/services/chat.service';
import { success } from '@/utils/apiResponse';

export const createChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await createOrGetChat(req.user!.id, req.body);
    res.status(201).json(success(chat, 'Chat ready'));
  } catch (err) {
    next(err);
  }
};

export const listChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chats = await getUserChats(req.user!.id);
    res.status(200).json(success(chats, 'Chats fetched'));
  } catch (err) {
    next(err);
  }
};

export const getChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await getChatById(req.params.chatId, req.user!.id);
    res.status(200).json(success(chat, 'Chat fetched'));
  } catch (err) {
    next(err);
  }
};

export const getBotChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await getOrCreateBotChat(req.user!.id);
    res.status(200).json(success(chat, 'Bot chat ready'));
  } catch (err) {
    next(err);
  }
};