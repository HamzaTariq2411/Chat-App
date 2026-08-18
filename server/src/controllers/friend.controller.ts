import { Request, Response, NextFunction } from 'express';
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
} from '@/services/friend.service';
import { success } from '@/utils/apiResponse';

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) ?? '';
    const users = await searchUsers(req.user!.id, query);
    res.status(200).json(success(users, 'Search results'));
  } catch (err) {
    next(err);
  }
};

export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const friendship = await sendFriendRequest(req.user!.id, req.body.recipientId);
    res.status(201).json(success(friendship, 'Friend request sent'));
  } catch (err) {
    next(err);
  }
};

export const respondRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const friendship = await respondToFriendRequest(
      req.params.friendshipId as string,
      req.user!.id,
      req.body.action
    );
    res.status(200).json(success(friendship, `Friend request ${req.body.action.toLowerCase()}ed`));
  } catch (err) {
    next(err);
  }
};

export const listFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const friends = await getFriends(req.user!.id);
    res.status(200).json(success(friends, 'Friends fetched'));
  } catch (err) {
    next(err);
  }
};

export const listPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await getPendingRequests(req.user!.id);
    res.status(200).json(success(requests, 'Pending requests fetched'));
  } catch (err) {
    next(err);
  }
};

export const listSentRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await getSentRequests(req.user!.id);
    res.status(200).json(success(requests, 'Sent requests fetched'));
  } catch (err) {
    next(err);
  }
};