import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.js'

export const handler = async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    const { tarea, area_id, prioridad } = JSON.parse(req.body)

    // Obtener usuarios disponibles en el área
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombre,
        asignaciones:tareas(count),
        habilidades
      `)
      .eq('area_id', area_id)
      .eq('activo', true)

    if (usuariosError) throw usuariosError

    // Encontrar el usuario más adecuado
    const usuarioAsignado = seleccionarUsuario(usuarios, tarea.habilidades_requeridas)

    if (!usuarioAsignado) {
      throw new Error('No hay usuarios disponibles con las habilidades requeridas')
    }

    // Crear la asignación
    const nuevaTarea = {
      ...tarea,
      user_id: usuarioAsignado.id,
      estado: 'pendiente',
      prioridad,
      fecha_asignacion: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tareas')
      .insert([nuevaTarea])
      .select()

    if (error) throw error

    // Enviar notificación
    await enviarNotificacion(supabase, usuarioAsignado.id, 'nueva_tarea', data[0])

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        data,
        usuario_asignado: usuarioAsignado.nombre 
      })
    }

  } catch (error) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    }
  }
}

function seleccionarUsuario(usuarios, habilidadesRequeridas) {
  const usuariosCalificados = usuarios.filter(usuario => 
    habilidadesRequeridas.every(hab => 
      usuario.habilidades.includes(hab)
    )
  )

  if (usuariosCalificados.length === 0) return null

  return usuariosCalificados.sort((a, b) => 
    (a.asignaciones.count || 0) - (b.asignaciones.count || 0)
  )[0]
}

async function enviarNotificacion(supabase, userId, tipo, data) {
  const notificacion = {
    user_id: userId,
    tipo: tipo,
    contenido: JSON.stringify(data),
    leida: false
  }

  await supabase.from('notificaciones').insert([notificacion])
} 