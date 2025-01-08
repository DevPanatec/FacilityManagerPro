import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface ReportGenerationOptions {
  report_id: string
  custom_filters?: Record<string, any>
  custom_date_range?: {
    start: string
    end: string
  }
}

// POST /api/reports/generate - Generate report
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

    const options = await request.json() as ReportGenerationOptions

    // Validate options
    if (!options.report_id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Get report definition
    const { data: reportDef, error: defError } = await supabase
      .from('report_definitions')
      .select('*')
      .eq('id', options.report_id)
      .single()

    if (defError) {
      throw defError
    }

    // Merge custom filters with report definition filters
    const filters = {
      ...reportDef.filters,
      ...options.custom_filters,
    }

    if (options.custom_date_range) {
      filters.date_range = options.custom_date_range
    }

    // Generate report (using stored procedure)
    const { data: report, error } = await supabase.rpc('generate_report', {
      report_definition: reportDef,
      filters,
      user_id: session.user.id,
    })

    if (error) {
      throw error
    }

    // Log report generation
    await supabase.rpc('audit.log', {
      action: 'GENERATE_REPORT',
      metadata: {
        report_id: options.report_id,
        generated_by: session.user.id,
        filters,
      },
    })

    return NextResponse.json(report)

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 