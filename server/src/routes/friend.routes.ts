import { Router } from 'express';
import {
  search,
  sendRequest,
  respondRequest,
  listFriends,
  listPendingRequests,
  listSentRequests,
} from '@/controllers/friend.controller';
import { validate } from '@/middlewares/validate.middleware';
import { protect } from '@/middlewares/auth.middleware';
import { sendRequestSchema, respondRequestSchema } from '@/validators/friend.validator';

const router = Router();

router.use(protect);

router.get('/search', search);
router.get('/', listFriends);
router.get('/requests/pending', listPendingRequests);
router.get('/requests/sent', listSentRequests);
router.post('/requests', validate(sendRequestSchema), sendRequest);
router.patch('/requests/:friendshipId', validate(respondRequestSchema), respondRequest);

export default router;