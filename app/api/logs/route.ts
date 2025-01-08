import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface LogQueryParams {
  page?: number
  per_page?: number
  start_date?: string
  end_date?: string
  level?: 'info' | 'warn' | 'error'
  source?: string
}

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const params: LogQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      per_page: parseInt(searchParams.get('per_page') || '50'),
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      level: searchParams.get('level') as LogQueryParams['level'] || undefined,
      source: searchParams.get('source') || undefined,
    }

    // Calculate pagination
    const from = (params.page - 1) * params.per_page
    const to = from + params.per_page - 1

    // Build query
    let query = supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply filters
    if (params.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params.end_date) {
      query = query.lte('created_at', params.end_date)
    }
    if (params.level) {
      query = query.eq('level', params.level)
    }
    if (params.source) {
      query = query.eq('source', params.source)
    }

    // Execute query
    const { data: logs, error, count } = await query

    if (error) {
      throw error
    }

    // Calculate pagination metadata
    const total_pages = count ? Math.ceil(count / params.per_page) : 0

    return NextResponse.json({
      data: logs,
      metadata: {
        current_page: params.page,
        per_page: params.per_page,
        total_items: count,
        total_pages,
      }
    })

  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
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

    const { level, message, source, metadata } = await request.json()

    // Validate required fields
    if (!level || !message) {
      return NextResponse.json(
        { error: 'Level and message are required' },
        { status: 400 }
      )
    }

    // Insert log entry
    const { data, error } = await supabase
      .from('logs')
      .insert({
        level,
        message,
        source,
        metadata,
        user_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
