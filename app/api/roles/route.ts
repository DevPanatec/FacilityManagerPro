import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

interface Role {
  id?: string
  name: string
  description?: string
  is_system_role: boolean
  permissions?: string[]  // Array of permission IDs
  scope?: {
    organization_id?: string
    facility_ids?: string[]
    department_ids?: string[]
  }
  metadata?: {
    max_subordinates?: number
    can_delegate?: boolean
    approval_required?: boolean
  }
}

// GET /api/roles - List roles
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
    const includePermissions = searchParams.get('include_permissions') === 'true'
    const organizationId = searchParams.get('organization_id')

    // Build query
    let query = supabase.from('roles').select(
      includePermissions 
        ? `*, role_permissions (permission_id, permissions (*))`
        : '*'
    )

    if (organizationId) {
      query = query.eq('scope->organization_id', organizationId)
    }

    const { data: roles, error } = await query

    if (error) {
      throw error
    }

    // Transform data if permissions were included
    const formattedRoles = includePermissions ? roles.map(role => ({
      ...role,
      permissions: role.role_permissions.map(rp => rp.permissions)
    })) : roles

    return NextResponse.json({ data: formattedRoles })

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create role
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

    const { role, permissions } = await request.json() as { 
      role: Role, 
      permissions?: string[] 
    }

    // Validate role data
    if (!role.name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Start transaction
    const { data, error } = await supabase.rpc('create_role_with_permissions', {
      role_data: {
        ...role,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
      },
      permission_ids: permissions || [],
    })

    if (error) {
      throw error
    }

    // Log role creation
    await supabase.rpc('audit.log', {
      action: 'CREATE_ROLE',
      metadata: {
        role_id: data.id,
        role_name: data.name,
        permissions: permissions,
        created_by: session.user.id,
      },
    })

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/:id - Update role
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

    const { id, updates, permissions } = await request.json() as {
      id: string
      updates: Partial<Role>
      permissions?: string[]
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    // Check if trying to modify a system role
    const { data: existingRole, error: checkError } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', id)
      .single()

    if (checkError) {
      throw checkError
    }

    if (existingRole?.is_system_role) {
      return NextResponse.json(
        { error: 'System roles cannot be modified' },
        { status: 403 }
      )
    }

    // Start transaction
    const { data, error } = await supabase.rpc('update_role_with_permissions', {
      role_id: id,
      role_updates: {
        ...updates,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      },
      new_permission_ids: permissions || [],
    })

    if (error) {
      throw error
    }

    // Log role update
    await supabase.rpc('audit.log', {
      action: 'UPDATE_ROLE',
      metadata: {
        role_id: id,
        updates,
        permissions,
        updated_by: session.user.id,
      },
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/:id - Delete role
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
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    // Check if role is a system role
    const { data: role, error: checkError } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', id)
      .single()

    if (checkError) {
      throw checkError
    }

    if (role?.is_system_role) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if role is assigned to any users
    const { data: usedByUsers, error: usageError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', id)

    if (usageError) {
      throw usageError
    }

    if (usedByUsers && usedByUsers.length > 0) {
      return NextResponse.json(
        { error: 'Role is currently assigned to users and cannot be deleted' },
        { status: 409 }
      )
    }

    // Delete role and its permissions (handled by foreign key cascade)
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    // Log role deletion
    await supabase.rpc('audit.log', {
      action: 'DELETE_ROLE',
      metadata: {
        role_id: id,
        deleted_by: session.user.id,
      },
    })

    return NextResponse.json(
      { message: 'Role deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
