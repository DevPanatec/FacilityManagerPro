import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/documents - Obtener documentos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const organizationId = searchParams.get('organizationId')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let query = supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles!documents_uploaded_by_fkey (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: documents, error } = await query

    if (error) throw error

    return NextResponse.json(documents)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener documentos';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// POST /api/documents - Crear documento
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Obtener organization_id del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Crear documento
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          organization_id: profile.organization_id,
          title: body.title,
          description: body.description,
          file_url: body.file_url,
          file_type: body.file_type,
          uploaded_by: user.id
        }
      ])
      .select(`
        *,
        uploader:profiles!documents_uploaded_by_fkey (
          first_name,
          last_name
        )
      `)

    if (error) throw error

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'create_document',
          description: `Document created: ${body.title}`
        }
      ])

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al crear documento';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// PUT /api/documents/[id] - Actualizar documento
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar propiedad del documento
    const { data: document } = await supabase
      .from('documents')
      .select('uploaded_by, organization_id')
      .eq('id', body.id)
      .single()

    if (!document || document.uploaded_by !== user.id) {
      throw new Error('No autorizado para actualizar este documento')
    }

    const { data, error } = await supabase
      .from('documents')
      .update({
        title: body.title,
        description: body.description,
        file_type: body.file_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar documento';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/documents/[id] - Eliminar documento
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Verificar propiedad del documento
    const { data: document } = await supabase
      .from('documents')
      .select('uploaded_by, file_url')
      .eq('id', id)
      .single()

    if (!document || document.uploaded_by !== user.id) {
      throw new Error('No autorizado para eliminar este documento')
    }

    // Eliminar archivo de storage si la URL es de Supabase Storage
    if (document.file_url.includes('storage.googleapis')) {
      const fileKey = document.file_url.split('/').pop()
      const { error: storageError } = await supabase
        .storage
        .from('documents')
        .remove([fileKey])

      if (storageError) throw storageError
    }

    // Eliminar registro de documento
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Documento eliminado exitosamente' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar documento';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
} 