import { z } from 'zod';

export const sendRequestSchema = z.object({
  recipientId: z.string().uuid(),
});

export const respondRequestSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

export type SendRequestInput = z.infer<typeof sendRequestSchema>;
export type RespondRequestInput = z.infer<typeof respondRequestSchema>;