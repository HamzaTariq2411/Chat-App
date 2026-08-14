import { Router } from 'express';
import { sendMessage, listMessages } from '@/controllers/message.controller';
import { validate } from '@/middlewares/validate.middleware';
import { protect } from '@/middlewares/auth.middleware';
import { sendMessageSchema } from '@/validators/message.validator';

const router = Router();

router.use(protect);

router.post('/', validate(sendMessageSchema), sendMessage);
router.get('/:chatId', listMessages);

export default router;