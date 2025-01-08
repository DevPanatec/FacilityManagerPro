import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Permission {
  id?: string
  name: string
  description?: string
  resource_type: 'facility' | 'maintenance' | 'inspection' | 'report' | 'user' | 'organization' | 'settings'
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  conditions?: {
    organization_id?: string[]
    facility_type?: string[]
    time_restricted?: {
      start_time?: string  // HH:mm
      end_time?: string    // HH:mm
      days?: number[]      // 0-6 (Sunday-Saturday)
    }
  }
}

// GET /api/permissions - List permissions
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const resource_type = searchParams.get('resource_type')
    const action = searchParams.get('action')

    // Build query
    let query = supabase
      .from('permissions')
      .select('*')

    if (resource_type) {
      query = query.eq('resource_type', resource_type)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const { data: permissions, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data: permissions })

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/permissions - Create permission
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const permission = await request.json() as Permission

    // Validate permission data
    if (!permission.name || !permission.resource_type || !permission.action) {
      return NextResponse.json(
        { error: 'Name, resource_type, and action are required' },
        { status: 400 }
      )
    }

    // Create permission
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        ...permission,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log permission creation
    await supabase.rpc('audit.log', {
      action: 'CREATE_PERMISSION',
      metadata: {
        permission_id: data.id,
        permission_name: data.name,
        created_by: session.user.id,
      },
    })

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/permissions/:id - Update permission
export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await request.json()
    const updates = await request.json() as Partial<Permission>

    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    // Update permission
    const { data, error } = await supabase
      .from('permissions')
      .update({
        ...updates,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log permission update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_PERMISSION',
      metadata: {
        permission_id: data.id,
        permission_name: data.name,
        updated_by: session.user.id,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating permission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/permissions/:id - Delete permission
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    
    // Verify user session and admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    // Check if permission is in use by any roles
    const { data: usedByRoles, error: checkError } = await supabase
      .from('role_permissions')
      .select('role_id')
      .eq('permission_id', id)

    if (checkError) {
      throw checkError
    }

    if (usedByRoles && usedByRoles.length > 0) {
      return NextResponse.json(
        { error: 'Permission is currently in use by one or more roles' },
        { status: 409 }
      )
    }

    // Delete permission
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Log permission deletion
    await supabase.rpc('audit.log', {
      action: 'DELETE_PERMISSION',
      metadata: {
        permission_id: id,
        deleted_by: session.user.id,
      },
    })

    return NextResponse.json(
      { message: 'Permission deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
