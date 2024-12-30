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

    const { lista_id, respuestas, user_id } = JSON.parse(req.body)

    // Obtener la lista de verificación
    const { data: lista, error: listaError } = await supabase
      .from('listas_verificacion')
      .select('*')
      .eq('id', lista_id)
      .single()

    if (listaError) throw listaError
    if (!lista) throw new Error('Lista de verificación no encontrada')

    // Procesar las respuestas
    const resultado = await procesarRespuestas(supabase, {
      lista_id,
      respuestas,
      user_id,
      fecha: new Date().toISOString()
    })

    // Verificar cumplimiento y generar alertas si es necesario
    const cumplimiento = calcularCumplimiento(respuestas)
    if (cumplimiento < lista.umbral_alerta) {
      await generarAlerta(supabase, {
        tipo: 'bajo_cumplimiento',
        lista_id,
        user_id,
        nivel: 'alto',
        detalles: {
          cumplimiento,
          umbral: lista.umbral_alerta
        }
      })
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: resultado,
        cumplimiento
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

async function procesarRespuestas(supabase, datos) {
  const { data, error } = await supabase
    .from('respuestas_verificacion')
    .insert([datos])
    .select()

  if (error) throw error
  return data[0]
}

function calcularCumplimiento(respuestas) {
  const total = respuestas.length
  const cumplidas = respuestas.filter(r => r.cumple).length
  return (cumplidas / total) * 100
}

async function generarAlerta(supabase, alerta) {
  await supabase.from('alertas').insert([alerta])
} 