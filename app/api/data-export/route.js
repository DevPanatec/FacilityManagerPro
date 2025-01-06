import { NextResponse } from 'next/server'
import { createClient } from '../../utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    
    // Get data
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        tasks(id, title, status),
        documents(id, title, file_url),
        cleaning_checklists(id, title, status)
      `)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      format
    });

  } catch (error) {
    console.error('Error en la exportación:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 