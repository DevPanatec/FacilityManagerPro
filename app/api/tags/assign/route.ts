import { createRouteHandlerClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const body = await request.json()
    const { 
      tag_id, 
      entity_type, 
      entity_id, 
      organization_id 
    } = body

    const { data, error } = await supabase
      .from('entity_tags')
      .insert({
        tag_id,
        entity_type,
        entity_id,
        organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const tag_id = searchParams.get('tag_id')
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')

    const { error } = await supabase
      .from('entity_tags')
      .delete()
      .match({ tag_id, entity_type, entity_id })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error occurred';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 
