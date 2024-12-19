import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
// import { ImportExportService } from '@/lib/importExport'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    
    // Obtener datos
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        tasks(id, title, status),
        documents(id, title, file_url),
        cleaning_checklists(id, title, status)
      `)

    if (error) throw error

    // Exportar según formato
    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 