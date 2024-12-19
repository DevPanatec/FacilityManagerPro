import { NextResponse } from 'next/server'
// import { ImportExportService } from '@/lib/importExport'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Funcionalidad no implementada'
    });

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 