import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { tarea, area_id, prioridad } = await req.json()

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

    // Encontrar el usuario más adecuado basado en carga de trabajo y habilidades
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

    // Enviar notificación al usuario asignado
    await enviarNotificacion(supabase, usuarioAsignado.id, 'nueva_tarea', data[0])

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        usuario_asignado: usuarioAsignado.nombre 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function seleccionarUsuario(usuarios: any[], habilidadesRequeridas: string[]) {
  // Filtrar usuarios que tienen las habilidades necesarias
  const usuariosCalificados = usuarios.filter(usuario => 
    habilidadesRequeridas.every(hab => 
      usuario.habilidades.includes(hab)
    )
  )

  if (usuariosCalificados.length === 0) return null

  // Ordenar por menor cantidad de asignaciones
  return usuariosCalificados.sort((a, b) => 
    (a.asignaciones.count || 0) - (b.asignaciones.count || 0)
  )[0]
}

async function enviarNotificacion(supabase: any, userId: string, tipo: string, data: any) {
  const notificacion = {
    user_id: userId,
    tipo: tipo,
    contenido: JSON.stringify(data),
    leida: false
  }

  await supabase.from('notificaciones').insert([notificacion])
} 