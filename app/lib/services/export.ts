import { Parser } from '@json2csv/plainjs'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { createWriteStream } from 'fs'
import path from 'path'

export type ExportFormat = 'csv' | 'pdf' | 'excel'

export class ExportService {
  private getFileName(baseName: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0]
    return `${baseName}_${timestamp}.${format}`
  }

  async toCSV(data: any[], fileName: string): Promise<Buffer> {
    try {
      const parser = new Parser()
      const csv = parser.parse(data)
      return Buffer.from(csv)
    } catch (error) {
      console.error('Error generating CSV:', error)
      throw new Error('Error al generar CSV')
    }
  }

  async toPDF(
    data: any[],
    fileName: string,
    options: {
      title: string
      subtitle?: string
      columns: { header: string; key: string }[]
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = []
        const doc = new PDFDocument({ margin: 50 })

        // Recolectar chunks
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        // Agregar título
        doc
          .fontSize(20)
          .text(options.title, { align: 'center' })
          .moveDown()

        if (options.subtitle) {
          doc
            .fontSize(14)
            .text(options.subtitle, { align: 'center' })
            .moveDown()
        }

        // Agregar fecha
        doc
          .fontSize(12)
          .text(`Generado: ${new Date().toLocaleString()}`)
          .moveDown()

        // Crear tabla
        const tableTop = 150
        let currentTop = tableTop

        // Headers
        options.columns.forEach((column, i) => {
          doc
            .fontSize(10)
            .text(
              column.header,
              50 + i * (doc.page.width - 100) / options.columns.length,
              currentTop
            )
        })

        currentTop += 20

        // Datos
        data.forEach(row => {
          // Nueva página si es necesario
          if (currentTop > doc.page.height - 50) {
            doc.addPage()
            currentTop = 50
          }

          options.columns.forEach((column, i) => {
            doc
              .fontSize(10)
              .text(
                String(row[column.key] || ''),
                50 + i * (doc.page.width - 100) / options.columns.length,
                currentTop
              )
          })

          currentTop += 20
        })

        doc.end()
      } catch (error) {
        console.error('Error generating PDF:', error)
        reject(new Error('Error al generar PDF'))
      }
    })
  }

  async toExcel(
    data: any[],
    fileName: string,
    options: {
      title: string
      sheets: {
        name: string
        columns: { header: string; key: string }[]
      }[]
    }
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Sistema'
      workbook.created = new Date()

      options.sheets.forEach(sheet => {
        const worksheet = workbook.addWorksheet(sheet.name)

        // Configurar columnas
        worksheet.columns = sheet.columns.map(col => ({
          header: col.header,
          key: col.key,
          width: 15
        }))

        // Estilo para headers
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

        // Agregar datos
        worksheet.addRows(data)

        // Auto-ajustar columnas
        worksheet.columns.forEach(column => {
          column.width = Math.max(
            ...worksheet.getColumn(column.key).values.map(v => 
              v ? String(v).length : 0
            )
          ) + 2
        })
      })

      return await workbook.xlsx.writeBuffer()
    } catch (error) {
      console.error('Error generating Excel:', error)
      throw new Error('Error al generar Excel')
    }
  }
} 