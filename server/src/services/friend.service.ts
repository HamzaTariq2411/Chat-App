import prisma from '@/config/db';
import { ApiError } from '@/utils/apiResponse';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  isBot: true,
  isOnline: true,
  lastSeen: true,
} as const;

// ---- Search users to add as friends (excludes self, bots, and existing friends/pending) ----
export const searchUsers = async (currentUserId: string, query: string) => {
  if (!query || query.trim().length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      isBot: false,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: publicUserSelect,
    take: 10,
  });

  // attach friendship status relative to current user for each result
  const results = await Promise.all(
    users.map(async (user) => {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, recipientId: user.id },
            { requesterId: user.id, recipientId: currentUserId },
          ],
        },
      });

      return {
        ...user,
        friendshipStatus: friendship?.status ?? null,
        isRequester: friendship?.requesterId === currentUserId,
      };
    })
  );

  return results;
};

// ---- Send a friend request ----
export const sendFriendRequest = async (requesterId: string, recipientId: string) => {
  if (requesterId === recipientId) {
    throw new ApiError(400, 'You cannot send a friend request to yourself');
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) throw new ApiError(404, 'User not found');
  if (recipient.isBot) throw new ApiError(400, 'You are always friends with PennBot');

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') throw new ApiError(409, 'You are already friends');
    if (existing.status === 'PENDING') throw new ApiError(409, 'A friend request is already pending');
    // REJECTED: allow a fresh request by updating the old row
    return prisma.friendship.update({
      where: { id: existing.id },
      data: { requesterId, recipientId, status: 'PENDING' },
      include: { requester: { select: publicUserSelect }, recipient: { select: publicUserSelect } },
    });
  }

  return prisma.friendship.create({
    data: { requesterId, recipientId, status: 'PENDING' },
    include: { requester: { select: publicUserSelect }, recipient: { select: publicUserSelect } },
  });
};

// ---- Respond to a request (accept/reject) ----
export const respondToFriendRequest = async (
  friendshipId: string,
  currentUserId: string,
  action: 'ACCEPT' | 'REJECT'
) => {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!friendship) throw new ApiError(404, 'Friend request not found');
  if (friendship.recipientId !== currentUserId) {
    throw new ApiError(403, 'You are not authorized to respond to this request');
  }
  if (friendship.status !== 'PENDING') {
    throw new ApiError(400, 'This request has already been responded to');
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' },
    include: { requester: { select: publicUserSelect }, recipient: { select: publicUserSelect } },
  });
};

// ---- List accepted friends ----
export const getFriends = async (userId: string) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { recipientId: userId }],
    },
    include: {
      requester: { select: publicUserSelect },
      recipient: { select: publicUserSelect },
    },
  });

  // normalize so we always return "the other person," regardless of who requested
  return friendships.map((f) => (f.requesterId === userId ? f.recipient : f.requester));
};

// ---- List incoming pending requests ----
export const getPendingRequests = async (userId: string) => {
  return prisma.friendship.findMany({
    where: { recipientId: userId, status: 'PENDING' },
    include: { requester: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });
};

// ---- List outgoing (sent, still pending) requests ----
export const getSentRequests = async (userId: string) => {
  return prisma.friendship.findMany({
    where: { requesterId: userId, status: 'PENDING' },
    include: { recipient: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });
};

// ---- Helper used by chat creation to enforce friends-only chats ----
export const areFriends = async (userAId: string, userBId: string): Promise<boolean> => {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userAId, recipientId: userBId },
        { requesterId: userBId, recipientId: userAId },
      ],
    },
  });
  return !!friendship;
};