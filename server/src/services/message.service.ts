import prisma from '@/config/db';
import { ApiError } from '@/utils/apiResponse';
import type { SendMessageInput } from '@/validators/message.validator';

export const createMessage = async (
  senderId: string,
  input: SendMessageInput,
  senderType: 'USER' | 'BOT' = 'USER'
) => {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId: input.chatId, userId: senderId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this chat');
  }

  const message = await prisma.message.create({
    data: {
      chatId: input.chatId,
      senderId,
      senderType,
      content: input.content,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true, isBot: true } },
    },
  });

  // bump chat's updatedAt so chat lists sort by recency
  await prisma.chat.update({
    where: { id: input.chatId },
    data: { updatedAt: new Date() },
  });

  return message;
};

export const getChatMessages = async (chatId: string, userId: string, cursor?: string) => {
  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this chat');
  }

  const messages = await prisma.message.findMany({
    where: { chatId },
    include: {
      sender: { select: { id: true, name: true, avatar: true, isBot: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });

  return messages.reverse(); // oldest -> newest for UI rendering
};