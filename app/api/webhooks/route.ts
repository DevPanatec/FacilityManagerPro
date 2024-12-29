import { handleWebhook } from '@/lib/webhooks/handler'

export async function POST(req: Request) {
  return handleWebhook(req)
} 