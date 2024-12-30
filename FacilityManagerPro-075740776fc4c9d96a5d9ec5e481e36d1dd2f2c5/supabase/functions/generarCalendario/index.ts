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

    // Obtener turnos
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select('*, usuario:usuarios(nombre)')
      .eq('area_id', area_id)
      .gte('fecha', fecha_inicio)
      .lte('fecha', fecha_fin)

    if (turnosError) throw turnosError

    // Obtener tareas programadas
    const { data: tareas, error: tareasError } = await supabase
      .from('tareas')
      .select('*, asignado:usuarios(nombre)')
      .eq('area_id', area_id)
      .gte('fecha_programada', fecha_inicio)
      .lte('fecha_programada', fecha_fin)

    if (tareasError) throw tareasError

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          turnos,
          tareas
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