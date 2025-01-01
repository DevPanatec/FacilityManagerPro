import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { TASK_STATUS, TASK_PRIORITY } from './types'

// GET /api/tasks - Obtener tareas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const categoryId = searchParams.get('categoryId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('tasks')
      .select(`
        *,
        task_categories (
          id,
          name,
          color
        ),
        profiles!tasks_assigned_to_fkey (
          first_name,
          last_name,
          avatar_url
        ),
        profiles!tasks_created_by_fkey (
          first_name,
          last_name
        )
      `)

    // Aplicar filtros
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    if (status && status in TASK_STATUS) {
      query = query.eq('status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: tasks, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener tareas' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// POST /api/tasks - Crear tarea
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar status y prioridad
    if (body.status && !(body.status in TASK_STATUS)) {
      throw new Error('Estado no válido')
    }
    if (body.priority && !(body.priority in TASK_PRIORITY)) {
      throw new Error('Prioridad no válida')
    }

    // Crear tarea
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          organization_id: body.organization_id,
          title: body.title,
          description: body.description,
          status: body.status || TASK_STATUS.TODO,
          priority: body.priority || TASK_PRIORITY.NORMAL,
          category_id: body.category_id,
          assigned_to: body.assigned_to,
          due_date: body.due_date,
          created_by: user.id
        }
      ])
      .select(`
        *,
        task_categories (
          id,
          name,
          color
        ),
        profiles!tasks_assigned_to_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `)

    if (error) throw error

    // Registrar en task_history
    await supabase
      .from('task_history')
      .insert([
        {
          task_id: data[0].id,
          user_id: user.id,
          action: 'create',
          description: 'Task created'
        }
      ])

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_task',
          description: `Task created: ${body.title}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al crear tarea' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// PUT /api/tasks/[id] - Actualizar tarea
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validar status y prioridad
    if (body.status && !(body.status in TASK_STATUS)) {
      throw new Error('Estado no válido')
    }
    if (body.priority && !(body.priority in TASK_PRIORITY)) {
      throw new Error('Prioridad no válida')
    }

    // Obtener tarea actual para comparar cambios
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', body.id)
      .single()

    // Actualizar tarea
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        category_id: body.category_id,
        assigned_to: body.assigned_to,
        due_date: body.due_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        task_categories (
          id,
          name,
          color
        ),
        profiles!tasks_assigned_to_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `)

    if (error) throw error

    // Registrar cambios en task_history
    if (currentTask) {
      const changes: string[] = []
      if (currentTask.status !== body.status) {
        changes.push(`Status changed from ${currentTask.status} to ${body.status}`)
      }
      if (currentTask.assigned_to !== body.assigned_to) {
        changes.push('Assignment changed')
      }
      if (changes.length > 0) {
        await supabase
          .from('task_history')
          .insert([
            {
              task_id: body.id,
              user_id: user.id,
              action: 'update',
              description: changes.join(', ')
            }
          ])
      }
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar tarea' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Eliminar tarea
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar que el usuario puede eliminar la tarea
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by, title')
      .eq('id', id)
      .single()

    if (!task || task.created_by !== user.id) {
      throw new Error('No autorizado para eliminar esta tarea')
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'delete_task',
          description: `Task deleted: ${task.title}`
        }
      ])

    return NextResponse.json({ message: 'Tarea eliminada exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar tarea' },
      { status: error.message.includes('No autorizado') ? 403 : 500 }
    )
  }
} 