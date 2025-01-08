import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface ExportRequest {
  type: 'facilities' | 'maintenance' | 'inspections' | 'reports'
  format: 'csv' | 'json' | 'xlsx'
  dateRange?: {
    start: string
    end: string
  }
  filters?: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verify user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as ExportRequest
    const { type, format, dateRange, filters } = body

    // Build query based on type and filters
    let query = supabase.from(type)

    if (dateRange) {
      query = query.gte('created_at', dateRange.start)
                  .lte('created_at', dateRange.end)
    }

    // Apply additional filters if any
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // Get data
    const { data, error } = await query.select('*')

    if (error) {
      throw error
    }

    // Format data based on requested format
    let formattedData: string
    let contentType: string

    switch (format) {
      case 'json':
        formattedData = JSON.stringify(data, null, 2)
        contentType = 'application/json'
        break
      case 'csv':
        // Convert data to CSV format
        const headers = Object.keys(data[0] || {}).join(',')
        const rows = data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' ? `"${value}"` : value
          ).join(',')
        )
        formattedData = [headers, ...rows].join('\n')
        contentType = 'text/csv'
        break
      case 'xlsx':
        // For XLSX, we'll return JSON and let the client handle conversion
        formattedData = JSON.stringify(data)
        contentType = 'application/json'
        break
      default:
        throw new Error('Unsupported format')
    }

    // Log export activity
    await supabase.rpc('audit.log', {
      action: 'DATA_EXPORT',
      metadata: {
        type,
        format,
        record_count: data.length,
        user_id: session.user.id,
      },
    })

    return new Response(formattedData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=${type}-export-${new Date().toISOString()}.${format}`,
      },
    })

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 