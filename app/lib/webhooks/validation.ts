import { z } from 'zod';

export const webhookPayloadSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.unknown()),
  timestamp: z.string().datetime().optional()
});

export function validateWebhookPayload(data: unknown) {
  return webhookPayloadSchema.safeParse(data);
} 