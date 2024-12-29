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

    const { area_id, periodo } = JSON.parse(req.body)

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

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: {
          periodo: { fechaInicio, fechaFin },
          estadisticas: estadisticasTareas,
          cumplimiento: cumplimientoVerificaciones,
          alertas: alertasActivas,
          kpis
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

function calcularRangoFechas(periodo) {
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

async function obtenerEstadisticasTareas(supabase, areaId, fechaInicio, fechaFin) {
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

async function obtenerCumplimientoVerificaciones(supabase, areaId, fechaInicio, fechaFin) {
  const { data, error } = await supabase
    .from('respuestas_verificacion')
    .select('cumplimiento')
    .eq('area_id', areaId)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

  if (error) throw error
  return data
}

async function obtenerAlertasActivas(supabase, areaId) {
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('area_id', areaId)
    .eq('estado', 'activa')

  if (error) throw error
  return data
}

function calcularKPIs(estadisticasTareas, cumplimientoVerificaciones) {
  // Implementar cálculos de KPIs según necesidades específicas
  return {
    eficiencia: calcularEficiencia(estadisticasTareas),
    cumplimientoPromedio: calcularPromedio(cumplimientoVerificaciones.map(v => v.cumplimiento))
  }
}

function calcularEficiencia(estadisticasTareas) {
  const completadas = estadisticasTareas.find(e => e.estado === 'completada')?.count || 0
  const total = estadisticasTareas.reduce((sum, e) => sum + e.count, 0)
  return total > 0 ? (completadas / total) * 100 : 0
}

function calcularPromedio(valores) {
  return valores.length > 0 
    ? valores.reduce((sum, val) => sum + val, 0) / valores.length 
    : 0
} 