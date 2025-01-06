import { NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'

export async function GET(request, { params }) {
  const supabase = await createClient()
  const { id } = params
  
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      staff_shifts(
        id,
        staff_id,
        shift_id
      ),
      tasks(
        id,
        title,
        description,
        status
      ),
      documents(
        id,
        title,
        file_url
      ),
      cleaning_checklists(
        id,
        title,
        status
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()
    
    // Actualizar organización principal
    const { data, error: orgError } = await supabase
      .from('organizations')
      .update({
        name: body.name,
        logo_url: body.logo_url,
        status: body.status
      })
      .eq('id', id)
      .select()

    if (orgError) throw orgError

    // Actualizar tareas si existen
    if (body.tasks) {
      // Eliminar tareas existentes
      await supabase
        .from('tasks')
        .delete()
        .eq('organization_id', id)

      // Insertar nuevas tareas
      if (body.tasks.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(body.tasks.map(task => ({
            organization_id: id,
            title: task.title,
            description: task.description,
            status: task.status
          })))

        if (tasksError) throw tasksError
      }
    }

    // Actualizar documentos si existen
    if (body.documents) {
      await supabase
        .from('documents')
        .delete()
        .eq('organization_id', id)

      if (body.documents.length > 0) {
        const { error: docsError } = await supabase
          .from('documents')
          .insert(body.documents.map(doc => ({
            organization_id: id,
            title: doc.title,
            file_url: doc.file_url
          })))

        if (docsError) throw docsError
      }
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    
    // Eliminar la organización (las tablas relacionadas se eliminarán por CASCADE)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      message: 'Organization and related data deleted successfully' 
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 