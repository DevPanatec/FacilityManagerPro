import { NextResponse } from 'next/server'
import { ImportExportService } from '@/lib/importExport'

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

    let data
    if (type === 'excel') {
      data = await ImportExportService.readExcelFile(file)
    } else if (type === 'csv') {
      data = await ImportExportService.readCSVFile(file)
    } else {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Almacenar archivo temporal
    const tempFile = await ImportExportService.storeTemporaryFile(file)

    // Validar y procesar datos
    const importedData = await ImportExportService.importData(data)

    return NextResponse.json({
      message: 'Import successful',
      data: importedData,
      tempFile
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 