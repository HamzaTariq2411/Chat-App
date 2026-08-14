import { z } from 'zod';

export const createChatSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1, 'At least one member is required'),
  type: z.enum(['PRIVATE', 'GROUP']).default('PRIVATE'),
  name: z.string().optional(), 
});

export type CreateChatInput = z.infer<typeof createChatSchema>;