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

    const { area_id, fecha_inicio, fecha_fin } = await req.json()

    // Obtener estadísticas de reportes
    const { data: reportes, error: reportesError } = await supabase
      .from('reportes')
      .select(`
        tipo,
        estado,
        prioridad,
        count
      `)
      .eq('area_id', area_id)
      .gte('fecha_creacion', fecha_inicio)
      .lte('fecha_creacion', fecha_fin)
      .group('tipo, estado, prioridad')

    if (reportesError) throw reportesError

    // Calcular tiempos de respuesta promedio
    const { data: tiempos, error: tiemposError } = await supabase
      .from('reportes')
      .select('tiempo_respuesta')
      .eq('area_id', area_id)
      .gte('fecha_creacion', fecha_inicio)
      .lte('fecha_creacion', fecha_fin)
      .not('tiempo_respuesta', 'is', null)

    if (tiemposError) throw tiemposError

    const tiempoPromedio = calcularPromedio(tiempos.map(t => t.tiempo_respuesta))

    // Agrupar y procesar estadísticas
    const estadisticas = procesarEstadisticas(reportes)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          estadisticas,
          tiempo_respuesta_promedio: tiempoPromedio,
          periodo: { fecha_inicio, fecha_fin }
        }
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

function calcularPromedio(valores: number[]): number {
  return valores.length > 0 
    ? valores.reduce((sum, val) => sum + val, 0) / valores.length 
    : 0
}

function procesarEstadisticas(reportes: any[]) {
  const porTipo = agruparPor(reportes, 'tipo')
  const porEstado = agruparPor(reportes, 'estado')
  const porPrioridad = agruparPor(reportes, 'prioridad')

  return {
    por_tipo: porTipo,
    por_estado: porEstado,
    por_prioridad: porPrioridad,
    total: reportes.reduce((sum, r) => sum + r.count, 0)
  }
}

function agruparPor(reportes: any[], campo: string) {
  return reportes.reduce((acc, r) => {
    acc[r[campo]] = (acc[r[campo]] || 0) + r.count
    return acc
  }, {})
} 