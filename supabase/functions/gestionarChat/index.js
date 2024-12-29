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

    const { action, mensaje, usuario_id, chat_id } = JSON.parse(req.body)

    switch (action) {
      case 'enviar_mensaje':
        const { data: nuevoMensaje, error: errorMensaje } = await supabase
          .from('mensajes')
          .insert([{
            chat_id,
            usuario_id,
            contenido: mensaje.contenido,
            tipo: mensaje.tipo || 'texto',
            fecha: new Date().toISOString()
          }])
          .select('*, usuario:usuarios(nombre)')

        if (errorMensaje) throw errorMensaje

        // Notificar a los participantes del chat
        await notificarParticipantes(supabase, chat_id, usuario_id, nuevoMensaje[0])

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: nuevoMensaje[0] })
        }

      case 'crear_chat':
        const { data: nuevoChat, error: errorChat } = await supabase
          .from('chats')
          .insert([{
            nombre: mensaje.nombre,
            tipo: mensaje.tipo || 'individual',
            creado_por: usuario_id,
            participantes: mensaje.participantes
          }])
          .select()

        if (errorChat) throw errorChat

        // Crear las relaciones usuario-chat
        await Promise.all(mensaje.participantes.map(async (participante) => {
          await supabase.from('usuarios_chats').insert([{
            usuario_id: participante,
            chat_id: nuevoChat[0].id,
            fecha_union: new Date().toISOString()
          }])
        }))

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: nuevoChat[0] })
        }

      case 'marcar_leido':
        const { error: errorLectura } = await supabase
          .from('usuarios_chats')
          .update({ ultimo_leido: new Date().toISOString() })
          .eq('usuario_id', usuario_id)
          .eq('chat_id', chat_id)

        if (errorLectura) throw errorLectura

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        }

      case 'obtener_mensajes':
        const { data: mensajes, error: errorObtener } = await supabase
          .from('mensajes')
          .select('*, usuario:usuarios(nombre)')
          .eq('chat_id', chat_id)
          .order('fecha', { ascending: true })
          .limit(50)

        if (errorObtener) throw errorObtener

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: mensajes })
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

async function notificarParticipantes(supabase, chatId, emisorId, mensaje) {
  // Obtener participantes del chat
  const { data: participantes } = await supabase
    .from('usuarios_chats')
    .select('usuario_id')
    .eq('chat_id', chatId)
    .neq('usuario_id', emisorId)

  // Enviar notificaciones
  await Promise.all(participantes.map(async (participante) => {
    await supabase.from('notificaciones').insert([{
      user_id: participante.usuario_id,
      tipo: 'nuevo_mensaje',
      contenido: JSON.stringify({
        chat_id: chatId,
        mensaje_preview: mensaje.contenido.substring(0, 50),
        emisor: mensaje.usuario.nombre
      }),
      leida: false
    }])
  }))
} 