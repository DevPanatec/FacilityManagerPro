import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { event_type, endpoint_url, secret_key } = await request.json()

    const { data, error } = await supabase
      .from('webhook_configs')
      .insert([
        {
          event_type,
          endpoint_url,
          secret_key,
          is_active: true,
          retry_count: 3
        }
      ])
      .select()

    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database error occurred';
      const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 400;
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}