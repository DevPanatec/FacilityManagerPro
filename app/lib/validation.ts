import { z } from 'zod';

const WebhookPayloadSchema = z.object({
  eventType: z.string().min(1),
  payload: z.record(z.unknown())
});

export function validateWebhookPayload(data: unknown) {
  try {
    const result = WebhookPayloadSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error };
  }
} 