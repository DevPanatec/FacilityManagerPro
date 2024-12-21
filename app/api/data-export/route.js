import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
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
      data
    });

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 