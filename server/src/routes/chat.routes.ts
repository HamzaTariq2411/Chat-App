import { Router } from 'express';
import { createChat, listChats, getChat, getBotChat } from '@/controllers/chat.controller';
import { validate } from '@/middlewares/validate.middleware';
import { protect } from '@/middlewares/auth.middleware';
import { createChatSchema } from '@/validators/chat.validator';

const router = Router();

router.use(protect); 

router.post('/', validate(createChatSchema), createChat);
router.get('/', listChats);
router.get('/bot', getBotChat);
router.get('/:chatId', getChat);

export default router;