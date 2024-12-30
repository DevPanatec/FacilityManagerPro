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

    const { action, mensaje, usuario_id, chat_id } = await req.json()

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

        return new Response(
          JSON.stringify({ success: true, data: nuevoMensaje[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

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
        await Promise.all(mensaje.participantes.map(async (participante: string) => {
          await supabase.from('usuarios_chats').insert([{
            usuario_id: participante,
            chat_id: nuevoChat[0].id,
            fecha_union: new Date().toISOString()
          }])
        }))

        return new Response(
          JSON.stringify({ success: true, data: nuevoChat[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'marcar_leido':
        const { error: errorLectura } = await supabase
          .from('usuarios_chats')
          .update({ ultimo_leido: new Date().toISOString() })
          .eq('usuario_id', usuario_id)
          .eq('chat_id', chat_id)

        if (errorLectura) throw errorLectura

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'obtener_mensajes':
        const { data: mensajes, error: errorObtener } = await supabase
          .from('mensajes')
          .select('*, usuario:usuarios(nombre)')
          .eq('chat_id', chat_id)
          .order('fecha', { ascending: true })
          .limit(50)

        if (errorObtener) throw errorObtener

        return new Response(
          JSON.stringify({ success: true, data: mensajes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Acción no válida')
    }

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

async function notificarParticipantes(supabase: any, chatId: string, emisorId: string, mensaje: any) {
  // Obtener participantes del chat
  const { data: participantes } = await supabase
    .from('usuarios_chats')
    .select('usuario_id')
    .eq('chat_id', chatId)
    .neq('usuario_id', emisorId)

  // Enviar notificaciones
  await Promise.all(participantes.map(async (participante: any) => {
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