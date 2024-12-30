const { createClient } = require('@supabase/supabase-js')
const { corsHeaders } = require('../_shared/cors')

exports.handler = async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    const { action, tarea_id, datos, user_id } = JSON.parse(req.body)

    switch (action) {
      case 'actualizar_estado':
        const { data: tareaActual, error: errorTarea } = await supabase
          .from('tareas')
          .select('estado, user_id')
          .eq('id', tarea_id)
          .single()

        if (errorTarea) throw errorTarea
        if (!tareaActual) throw new Error('Tarea no encontrada')
        if (tareaActual.user_id !== user_id) throw new Error('No autorizado')

        const { data: tareaActualizada, error: errorActualizar } = await supabase
          .from('tareas')
          .update({ estado: datos.estado })
          .eq('id', tarea_id)
          .select()

        if (errorActualizar) throw errorActualizar

        // Registrar el cambio de estado
        await registrarCambioEstado(supabase, {
          tarea_id,
          estado_anterior: tareaActual.estado,
          estado_nuevo: datos.estado,
          user_id,
          fecha: new Date().toISOString()
        })

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: tareaActualizada })
        }

      case 'agregar_comentario':
        const { data: comentario, error: errorComentario } = await supabase
          .from('comentarios_tarea')
          .insert([{
            tarea_id,
            user_id,
            contenido: datos.contenido,
            fecha: new Date().toISOString()
          }])
          .select()

        if (errorComentario) throw errorComentario

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: comentario })
        }

      default:
        throw new Error('Acción no válida')
    }

  } catch (error) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    }
  }
}

async function registrarCambioEstado(supabase, datos) {
  await supabase.from('historial_estados').insert([datos])
} 