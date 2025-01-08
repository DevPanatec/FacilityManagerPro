import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Organization {
  id?: string
  name: string
  description?: string
  logo_url?: string
  settings?: {
    timezone: string
    date_format: string
    currency: string
    language: string
  }
  contact_info?: {
    email: string
    phone?: string
    address?: {
      street: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  subscription_tier?: 'free' | 'basic' | 'professional' | 'enterprise'
}

// GET /api/organizations - List organizations
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' })

    // Add search if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: organizations, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      data: organizations,
      metadata: {
        total: count,
        limit,
        offset,
      }
    })

  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create organization
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

    const organization = await request.json() as Organization

    // Validate organization data
    if (!organization.name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Create organization
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        ...organization,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create organization membership for creator
    await supabase
      .from('organization_members')
      .insert({
        organization_id: data.id,
        user_id: session.user.id,
        role: 'owner',
      })

    // Log organization creation
    await supabase.rpc('audit.log', {
      action: 'CREATE_ORGANIZATION',
      metadata: {
        organization_id: data.id,
        organization_name: data.name,
        created_by: session.user.id,
      },
    })

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/organizations - Batch update organizations
export async function PATCH(request: Request) {
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

    const updates = await request.json() as { id: string, changes: Partial<Organization> }[]

    // Validate updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid update format' },
        { status: 400 }
      )
    }

    // Perform updates
    const results = await Promise.all(
      updates.map(async ({ id, changes }) => {
        const { data, error } = await supabase
          .from('organizations')
          .update({
            ...changes,
            updated_at: new Date().toISOString(),
            updated_by: session.user.id,
          })
          .eq('id', id)
          .select()
          .single()

        return { id, success: !error, data, error }
      })
    )

    // Log batch update
    await supabase.rpc('audit.log', {
      action: 'BATCH_UPDATE_ORGANIZATIONS',
      metadata: {
        updated_organizations: updates.map(u => u.id),
        updated_by: session.user.id,
      },
    })

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Error updating organizations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations - Batch delete organizations
export async function DELETE(request: Request) {
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

    const { ids } = await request.json() as { ids: string[] }

    // Validate IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Organization IDs are required' },
        { status: 400 }
      )
    }

    // Delete organizations
    const { error } = await supabase
      .from('organizations')
      .delete()
      .in('id', ids)

    if (error) {
      throw error
    }

    // Log deletion
    await supabase.rpc('audit.log', {
      action: 'DELETE_ORGANIZATIONS',
      metadata: {
        deleted_organization_ids: ids,
        deleted_by: session.user.id,
      },
    })

    return NextResponse.json(
      { message: 'Organizations deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting organizations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
