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

    const { area_id, periodo } = await req.json()

    // Obtener rango de fechas
    const { fechaInicio, fechaFin } = calcularRangoFechas(periodo)

    // Obtener estadísticas de tareas
    const estadisticasTareas = await obtenerEstadisticasTareas(supabase, area_id, fechaInicio, fechaFin)

    // Obtener cumplimiento de verificaciones
    const cumplimientoVerificaciones = await obtenerCumplimientoVerificaciones(supabase, area_id, fechaInicio, fechaFin)

    // Obtener alertas activas
    const alertasActivas = await obtenerAlertasActivas(supabase, area_id)

    // Calcular indicadores clave
    const kpis = calcularKPIs(estadisticasTareas, cumplimientoVerificaciones)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          periodo: { fechaInicio, fechaFin },
          estadisticas: estadisticasTareas,
          cumplimiento: cumplimientoVerificaciones,
          alertas: alertasActivas,
          kpis
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

function calcularRangoFechas(periodo: string) {
  const fechaFin = new Date()
  let fechaInicio = new Date()

  switch (periodo) {
    case 'semana':
      fechaInicio.setDate(fechaInicio.getDate() - 7)
      break
    case 'mes':
      fechaInicio.setMonth(fechaInicio.getMonth() - 1)
      break
    case 'trimestre':
      fechaInicio.setMonth(fechaInicio.getMonth() - 3)
      break
    default:
      fechaInicio.setDate(fechaInicio.getDate() - 7)
  }

  return {
    fechaInicio: fechaInicio.toISOString(),
    fechaFin: fechaFin.toISOString()
  }
}

async function obtenerEstadisticasTareas(supabase: any, areaId: string, fechaInicio: string, fechaFin: string) {
  const { data, error } = await supabase
    .from('tareas')
    .select('estado, count')
    .eq('area_id', areaId)
    .gte('fecha_creacion', fechaInicio)
    .lte('fecha_creacion', fechaFin)
    .group('estado')

  if (error) throw error
  return data
}

async function obtenerCumplimientoVerificaciones(supabase: any, areaId: string, fechaInicio: string, fechaFin: string) {
  const { data, error } = await supabase
    .from('respuestas_verificacion')
    .select('cumplimiento')
    .eq('area_id', areaId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

  if (error) throw error
  return data
}

async function obtenerAlertasActivas(supabase: any, areaId: string) {
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('area_id', areaId)
    .eq('estado', 'activa')

  if (error) throw error
  return data
}

function calcularKPIs(estadisticasTareas: any[], cumplimientoVerificaciones: any[]) {
  return {
    eficiencia: calcularEficiencia(estadisticasTareas),
    cumplimientoPromedio: calcularPromedio(cumplimientoVerificaciones.map(v => v.cumplimiento))
  }
}

function calcularEficiencia(estadisticasTareas: any[]): number {
  const completadas = estadisticasTareas.find(e => e.estado === 'completada')?.count || 0
  const total = estadisticasTareas.reduce((sum, e) => sum + e.count, 0)
  return total > 0 ? (completadas / total) * 100 : 0
}

function calcularPromedio(valores: number[]): number {
  return valores.length > 0 
    ? valores.reduce((sum, val) => sum + val, 0) / valores.length 
    : 0
} 