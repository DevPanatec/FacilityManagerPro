import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      '34ad2c5f-2758-40fa-9ccc-1f39d4d4d245',
      {
        user_metadata: {
          role: 'admin',
          first_name: 'Usuario',
          last_name: 'Prueba'
        }
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
  }
} 