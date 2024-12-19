import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ImportExportService } from '@/lib/importExport'

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
    if (format === 'excel') {
      await ImportExportService.exportToExcel(data, 'organizations.xlsx')
    } else if (format === 'csv') {
      ImportExportService.exportToCSV(data, 'organizations.csv')
    } else {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Export successful',
      format
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 