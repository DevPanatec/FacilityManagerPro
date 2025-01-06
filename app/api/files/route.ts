import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/files - Obtener documentos
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    let query = supabase
      .from('documents')
      .select(`
        *,
        profiles!documents_uploaded_by_fkey (
          first_name,
          last_name
        ),
        organizations (
          name
        )
      `)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: documents, error } = await query
      .order('created_at', { ascending: false })

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

// POST /api/files - Subir documento
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Subir archivo
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(`${metadata.organization_id}/${Date.now()}-${file.name}`, file)

    if (uploadError) throw uploadError

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(fileData.path)

    // Crear registro en la tabla documents
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          organization_id: metadata.organization_id,
          title: metadata.title || file.name,
          description: metadata.description,
          file_url: publicUrl,
          file_type: file.type,
          uploaded_by: user.id
        }
      ])
      .select()

    if (dbError) throw dbError

    // Registrar en activity_logs
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action: 'upload_document',
          description: `Document uploaded: ${metadata.title || file.name}`
        }
      ])

    return NextResponse.json(document)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al subir documento';
    const statusCode = error instanceof Error && error.message.includes('No autorizado') ? 403 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// DELETE /api/files/[id] - Eliminar documento
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Obtener información del documento
    const { data: document } = await supabase
      .from('documents')
      .select('file_url, uploaded_by')
      .eq('id', id)
      .single()

    if (!document) throw new Error('Documento no encontrado')

    // Verificar propiedad
    const { data: { user } } = await supabase.auth.getUser()
    if (document.uploaded_by !== user?.id) {
      throw new Error('No autorizado para eliminar este documento')
    }

    // Obtener path del archivo desde la URL
    const fileUrl = new URL(document.file_url)
    const filePath = fileUrl.pathname.split('/').slice(-2).join('/')

    // Eliminar archivo del storage
    const { error: storageError } = await supabase
      .storage
      .from('documents')
      .remove([filePath])

    if (storageError) throw storageError

    // Eliminar registro de la base de datos
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

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