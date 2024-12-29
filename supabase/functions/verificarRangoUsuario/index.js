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

    const { user_id, rango_requerido } = JSON.parse(req.body)

    // Obtener información del usuario
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('rango, area_id')
      .eq('id', user_id)
      .single()

    if (userError) throw userError
    if (!usuario) throw new Error('Usuario no encontrado')

    // Verificar el rango
    const tieneAcceso = verificarAcceso(usuario.rango, rango_requerido)

    // Si tiene acceso, registrar la verificación
    if (tieneAcceso) {
      await registrarVerificacion(supabase, {
        user_id,
        rango_verificado: rango_requerido,
        resultado: true,
        fecha: new Date().toISOString()
      })
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tiene_acceso: tieneAcceso,
        usuario: {
          rango: usuario.rango,
          area_id: usuario.area_id
        }
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

function verificarAcceso(rangoUsuario, rangoRequerido) {
  const rangos = ['operador', 'supervisor', 'administrador']
  const nivelUsuario = rangos.indexOf(rangoUsuario)
  const nivelRequerido = rangos.indexOf(rangoRequerido)
  
  return nivelUsuario >= nivelRequerido
}

async function registrarVerificacion(supabase, datos) {
  await supabase.from('verificaciones_rango').insert([datos])
} 