import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;