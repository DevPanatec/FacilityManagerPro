import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { TASK_STATUS, TASK_PRIORITY } from './types'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

// GET /api/tasks - Obtener tareas
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigned_to = searchParams.get('assigned_to')
    const area_id = searchParams.get('area_id')
    const sala_id = searchParams.get('sala_id')

    let query = supabase
      .from('tasks')
      .select(`
        *,
        users!tasks_assigned_to_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }
    if (area_id) {
      query = query.eq('area_id', area_id)
    }
    if (sala_id) {
      query = query.eq('sala_id', sala_id)
    }

    const { data: tasks, error } = await query

    if (error) throw error

    return NextResponse.json(tasks)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener tareas'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear tarea'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
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

    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tarea'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// DELETE /api/tasks/[id] - Eliminar tarea
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('ID de tarea requerido')
    
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

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tarea'
    const status = errorMessage.includes('No autorizado') ? 403 : 500
    return NextResponse.json({ error: errorMessage }, { status })
  }
} 