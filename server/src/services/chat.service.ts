import prisma from '@/config/db';
import { ApiError } from '@/utils/apiResponse';
import type { CreateChatInput } from '@/validators/chat.validator';

// Shape used everywhere we return a chat with members
const chatInclude = {
  members: {
    include: {
      user: { select: { id: true, name: true, avatar: true, isBot: true, isOnline: true, lastSeen: true } },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
};

export const createOrGetChat = async (currentUserId: string, input: CreateChatInput) => {
  const { memberIds, type, name } = input;

  if (type === 'GROUP' && !name) {
    throw new ApiError(400, 'Group chats require a name');
  }

  const allMemberIds = Array.from(new Set([currentUserId, ...memberIds]));

  // For PRIVATE chats: check if a chat between exactly these 2 users already exists
  if (type === 'PRIVATE' && allMemberIds.length === 2) {
    const existing = await prisma.chat.findFirst({
      where: {
        type: 'PRIVATE',
        AND: allMemberIds.map((id) => ({
          members: { some: { userId: id } },
        })),
      },
      include: chatInclude,
    });

    if (existing) return existing;
  }

  const chat = await prisma.chat.create({
    data: {
      type,
      name: type === 'GROUP' ? name : null,
      members: {
        create: allMemberIds.map((userId) => ({
          userId,
          isAdmin: userId === currentUserId,
        })),
      },
    },
    include: chatInclude,
  });

  return chat;
};

export const getUserChats = async (userId: string) => {
  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId } } },
    include: chatInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return chats;
};

export const getChatById = async (chatId: string, userId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: chatInclude,
  });

  if (!chat) throw new ApiError(404, 'Chat not found');

  const isMember = chat.members.some((m) => m.userId === userId);
  if (!isMember) throw new ApiError(403, 'You are not a member of this chat');

  return chat;
};

export const getOrCreateBotChat = async (userId: string) => {
  const bot = await prisma.user.findFirst({ where: { isBot: true } });
  if (!bot) throw new ApiError(500, 'Bot user not seeded. Run `npm run seed`.');

  return createOrGetChat(userId, { memberIds: [bot.id], type: 'PRIVATE' });
};