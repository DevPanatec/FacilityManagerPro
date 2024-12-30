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

    const { lista_id, respuestas, user_id } = await req.json()

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

    return new Response(
      JSON.stringify({
        success: true,
        data: resultado,
        cumplimiento
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

async function procesarRespuestas(supabase: any, datos: any) {
  const { data, error } = await supabase
    .from('respuestas_verificacion')
    .insert([datos])
    .select()

  if (error) throw error
  return data[0]
}

function calcularCumplimiento(respuestas: any[]): number {
  const total = respuestas.length
  const cumplidas = respuestas.filter(r => r.cumple).length
  return (cumplidas / total) * 100
}

async function generarAlerta(supabase: any, alerta: any) {
  await supabase.from('alertas').insert([alerta])
} 