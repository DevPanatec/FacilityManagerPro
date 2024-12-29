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

    const { action, turnoData, userId } = JSON.parse(req.body)

    switch (action) {
      case 'crear':
        // Verificar conflictos de horario
        const { data: conflictos, error: conflictosError } = await supabase
          .from('turnos')
          .select('*')
          .eq('user_id', turnoData.user_id)
          .overlaps('horario', turnoData.horario)

        if (conflictosError) throw conflictosError
        if (conflictos && conflictos.length > 0) {
          throw new Error('Existe un conflicto de horarios')
        }

        // Crear nuevo turno
        const { data, error } = await supabase
          .from('turnos')
          .insert([turnoData])
          .select()

        if (error) throw error

        // Enviar notificación
        await enviarNotificacion(supabase, turnoData.user_id, 'nuevo_turno', data[0])

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data })
        }

      case 'actualizar':
        const { data: dataUpdate, error: errorUpdate } = await supabase
          .from('turnos')
          .update(turnoData)
          .eq('id', turnoData.id)
          .select()

        if (errorUpdate) throw errorUpdate

        // Enviar notificación de actualización
        await enviarNotificacion(supabase, turnoData.user_id, 'turno_actualizado', dataUpdate[0])

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: dataUpdate })
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

async function enviarNotificacion(supabase, userId, tipo, data) {
  const notificacion = {
    user_id: userId,
    tipo: tipo,
    contenido: JSON.stringify(data),
    leida: false
  }

  await supabase.from('notificaciones').insert([notificacion])
} 